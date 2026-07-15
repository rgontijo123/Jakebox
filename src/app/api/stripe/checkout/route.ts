import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { getPack } from "@/lib/pricing";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const pack = getPack(body?.packId);
  if (!pack) {
    return NextResponse.json({ error: "Unknown credit pack" }, { status: 400 });
  }

  const origin = req.headers.get("origin") ?? new URL(req.url).origin;

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: pack.usdCents,
          product_data: {
            name: `Jakebox ${pack.name} pack — ${pack.credits} credits`,
          },
        },
      },
    ],
    metadata: {
      userId: session.user.id,
      packId: pack.id,
      credits: String(pack.credits),
    },
    success_url: `${origin}/billing?purchase=success`,
    cancel_url: `${origin}/billing?purchase=cancelled`,
  });

  if (!checkoutSession.url) {
    return NextResponse.json({ error: "Could not start checkout" }, { status: 500 });
  }

  return NextResponse.json({ url: checkoutSession.url });
}
