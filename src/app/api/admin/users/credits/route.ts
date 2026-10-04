import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { grantAdminAdjustment } from "@/lib/credits";

// Separate from /api/admin/users/[id]/credits: looks the target up by email
// instead of id, so an owner can top up an account before it has any
// generations to find its id through (the admin page only lists generations,
// so a brand-new test account with none yet has no row to click a button on).
export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "owner" && session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const amount = Number(body?.amount);
  if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 });
  if (!Number.isInteger(amount) || amount === 0) {
    return NextResponse.json({ error: "amount must be a non-zero integer" }, { status: 400 });
  }

  const target = await db.user.findUnique({ where: { email } });
  if (!target) return NextResponse.json({ error: "No user with that email" }, { status: 404 });

  const balance = await grantAdminAdjustment(target.id, amount);

  return NextResponse.json({ ok: true, email: target.email, balance });
}
