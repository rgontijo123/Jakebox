import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { currencyForLocale, getPlan, priceCents } from "@/lib/pricing";
import { getLocale } from "@/lib/i18n/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const plan = getPlan(body?.planId);
  if (!plan) {
    return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
  }

  const user = await db.user.findUniqueOrThrow({ where: { id: session.user.id } });
  if (user.stripeSubscriptionId && user.planStatus && user.planStatus !== "canceled") {
    return NextResponse.json({ error: "You already have an active plan" }, { status: 409 });
  }

  // same currency the plan card showed (it follows the site language)
  const currency = currencyForLocale(await getLocale());
  const origin = req.headers.get("origin") ?? new URL(req.url).origin;

  async function newCustomer() {
    const customer = await stripe.customers.create({ email: user.email, metadata: { userId: user.id } });
    await db.user.update({ where: { id: user.id }, data: { stripeCustomerId: customer.id } });
    return customer.id;
  }

  // One Stripe customer per user, reused across subscriptions, so their
  // invoices and saved card stay together.
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    customerId = await newCustomer();
  } else {
    // Stripe locks a customer to the currency of its earlier subscriptions;
    // someone who subscribed in reais and now subscribes in dollars (or the
    // other way round) needs a fresh customer or Checkout refuses.
    const existing = await stripe.customers.retrieve(customerId);
    if (existing.deleted || (existing.currency && existing.currency !== currency)) {
      customerId = await newCustomer();
    }
  }

  const productName =
    currency === "brl"
      ? `Jakebox ${plan.name} — ${plan.songsPerMonth} músicas/mês`
      : `Jakebox ${plan.name} — ${plan.songsPerMonth} songs/month`;

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.id,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: priceCents(plan, currency),
          recurring: { interval: "month" },
          product_data: { name: productName },
        },
      },
    ],
    // read back by the webhook's invoice.paid handler to know whose quota to refill
    subscription_data: { metadata: { userId: user.id, planId: plan.id } },
    success_url: `${origin}/billing?plan=success`,
    cancel_url: `${origin}/billing?plan=cancelled`,
  });

  if (!checkoutSession.url) {
    return NextResponse.json({ error: "Could not start checkout" }, { status: 500 });
  }

  return NextResponse.json({ url: checkoutSession.url });
}
