import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

/** Cancels at the end of the paid period (the user keeps the songs they
 * already paid for until then). `{ resume: true }` undoes a pending cancel. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const resume = Boolean(body?.resume);

  const user = await db.user.findUniqueOrThrow({ where: { id: session.user.id } });
  if (!user.stripeSubscriptionId || user.planStatus === "canceled") {
    return NextResponse.json({ error: "No active plan" }, { status: 400 });
  }

  await stripe.subscriptions.update(user.stripeSubscriptionId, { cancel_at_period_end: !resume });
  await db.user.update({ where: { id: user.id }, data: { planCancelAtPeriodEnd: !resume } });

  return NextResponse.json({ ok: true });
}
