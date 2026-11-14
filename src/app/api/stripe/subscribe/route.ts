import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { getPlan } from "@/lib/pricing";

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

  // One Stripe customer per user, reused across subscriptions, so their
  // invoices and saved card stay together.
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email, metadata: { userId: user.id } });
    customerId = customer.id;
    await db.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
  }

  const origin = req.headers.get("origin") ?? new URL(req.url).origin;

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.id,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "brl",
          unit_amount: plan.brlCents,
          recurring: { interval: "month" },
          product_data: { name: `Jakebox ${plan.name} — ${plan.songsPerMonth} músicas/mês` },
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
