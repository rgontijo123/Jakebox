import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { grantPurchase } from "@/lib/credits";
import { getPack, getPlan } from "@/lib/pricing";

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  if (!STRIPE_WEBHOOK_SECRET) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Subscription checkouts are handled by the invoice.paid /
  // customer.subscription.* events below, not here.
  if (event.type === "checkout.session.completed" && (event.data.object as Stripe.Checkout.Session).mode === "payment") {
    const checkoutSession = event.data.object as Stripe.Checkout.Session;

    // Idempotency: Stripe can deliver the same event more than once.
    const existing = await db.payment.findUnique({
      where: { stripeCheckoutSessionId: checkoutSession.id },
    });
    if (existing) {
      return NextResponse.json({ ok: true, alreadyProcessed: true });
    }

    const userId = checkoutSession.metadata?.userId;
    const packId = checkoutSession.metadata?.packId;
    const pack = packId ? getPack(packId) : undefined;

    if (!userId || !pack) {
      console.error("Stripe webhook: missing/unknown userId or pack in session metadata", checkoutSession.id);
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    const payment = await db.payment.create({
      data: {
        userId,
        stripeCheckoutSessionId: checkoutSession.id,
        stripePaymentIntentId:
          typeof checkoutSession.payment_intent === "string" ? checkoutSession.payment_intent : null,
        amountUsdCents: checkoutSession.amount_total ?? pack.usdCents,
        creditsPurchased: pack.credits,
        status: "completed",
      },
    });

    await grantPurchase(userId, pack.credits, payment.id);
  }

  if (event.type === "invoice.paid") {
    await handleInvoicePaid(event.data.object as Stripe.Invoice);
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    await syncSubscription(event.data.object as Stripe.Subscription, event.type === "customer.subscription.deleted");
  }

  return NextResponse.json({ ok: true });
}

/** Every paid plan invoice (first one and each monthly renewal) resets the
 * user's songQuota to the plan's monthly songs -- unused songs don't roll
 * over. Leftover free-trial songs are kept on the very first invoice. */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionRef = invoice.parent?.subscription_details?.subscription;
  if (!subscriptionRef || !invoice.id) return;
  const subscriptionId = typeof subscriptionRef === "string" ? subscriptionRef : subscriptionRef.id;

  // Idempotency: Stripe can deliver the same event more than once.
  const existing = await db.payment.findUnique({ where: { stripeInvoiceId: invoice.id } });
  if (existing) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata.userId;
  const plan = getPlan(subscription.metadata.planId);
  if (!userId || !plan) {
    console.error("Stripe webhook: subscription missing userId/planId metadata", subscriptionId);
    return;
  }
  const periodEnd = subscription.items.data[0]?.current_period_end;
  const invoiceId = invoice.id;

  try {
    await db.$transaction(async (tx) => {
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      const carryOver = invoice.billing_reason === "subscription_create" ? user.songQuota : 0;
      await tx.payment.create({
        data: {
          userId,
          stripeInvoiceId: invoiceId,
          amountUsdCents: invoice.amount_paid,
          currency: invoice.currency,
          creditsPurchased: 0,
          songsGranted: plan.songsPerMonth,
          status: "completed",
        },
      });
      await tx.user.update({
        where: { id: userId },
        data: {
          songQuota: plan.songsPerMonth + carryOver,
          planId: plan.id,
          planStatus: subscription.status,
          planCurrentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
          planCancelAtPeriodEnd: subscription.cancel_at_period_end,
          stripeSubscriptionId: subscriptionId,
          stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
        },
      });
    });
  } catch (err) {
    // a concurrent duplicate delivery lost the race on the unique invoice id
    if ((err as { code?: string })?.code === "P2002") return;
    throw err;
  }
}

async function syncSubscription(subscription: Stripe.Subscription, deleted: boolean) {
  const user =
    (await db.user.findUnique({ where: { stripeSubscriptionId: subscription.id } })) ??
    (subscription.metadata.userId ? await db.user.findUnique({ where: { id: subscription.metadata.userId } }) : null);
  // ignore events for an older subscription the user has since replaced
  if (!user || (user.stripeSubscriptionId && user.stripeSubscriptionId !== subscription.id)) return;

  if (deleted) {
    await db.user.update({
      where: { id: user.id },
      data: {
        planId: null,
        planStatus: "canceled",
        planCancelAtPeriodEnd: false,
        planCurrentPeriodEnd: null,
        stripeSubscriptionId: null,
        songQuota: 0,
      },
    });
    return;
  }

  // a late "updated" for a subscription that has already ended
  if (subscription.status === "canceled") return;

  const periodEnd = subscription.items.data[0]?.current_period_end;
  await db.user.update({
    where: { id: user.id },
    data: {
      planId: getPlan(subscription.metadata.planId)?.id ?? user.planId,
      planStatus: subscription.status,
      planCancelAtPeriodEnd: subscription.cancel_at_period_end,
      planCurrentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : user.planCurrentPeriodEnd,
      stripeSubscriptionId: subscription.id,
    },
  });
}
