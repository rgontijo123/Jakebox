import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { grantPurchase } from "@/lib/credits";
import { getPack } from "@/lib/pricing";

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

  if (event.type === "checkout.session.completed") {
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

  return NextResponse.json({ ok: true });
}
