import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { grantSignupBonus } from "@/lib/credits";

const TOS_VERSION = "2026-07-13";
const SIGNUP_BONUS = Number(process.env.SIGNUP_BONUS_CREDITS ?? 50);

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = (body?.email as string | undefined)?.trim().toLowerCase();
  const password = body?.password as string | undefined;
  const tosAccepted = body?.tosAccepted as boolean | undefined;

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }
  if (!tosAccepted) {
    return NextResponse.json({ error: "You must accept the Acceptable Use Policy" }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await db.user.create({
    data: {
      email,
      passwordHash,
      tosAcceptedAt: new Date(),
      tosVersion: TOS_VERSION,
    },
  });

  await grantSignupBonus(user.id, SIGNUP_BONUS);

  return NextResponse.json({ ok: true });
}
