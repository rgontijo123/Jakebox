import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { grantSignupBonus } from "@/lib/credits";
import { isPasswordValid, PASSWORD_REQUIREMENTS_HINT } from "@/lib/passwordPolicy";

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
  if (!password || !isPasswordValid(password)) {
    return NextResponse.json({ error: `Password requirements: ${PASSWORD_REQUIREMENTS_HINT}` }, { status: 400 });
  }
  if (!tosAccepted) {
    return NextResponse.json({ error: "You must accept the Acceptable Use Policy" }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // The one designated owner email (set via OWNER_EMAIL) gets the "owner"
  // role straight from signup -- otherwise a brand-new database has no
  // owner account and no way to grant one, since the admin panel itself
  // requires an existing owner/admin session to use.
  const isOwner = !!process.env.OWNER_EMAIL && email === process.env.OWNER_EMAIL.trim().toLowerCase();

  const user = await db.user.create({
    data: {
      email,
      passwordHash,
      role: isOwner ? "owner" : "user",
      tosAcceptedAt: new Date(),
      tosVersion: TOS_VERSION,
    },
  });

  await grantSignupBonus(user.id, SIGNUP_BONUS);

  return NextResponse.json({ ok: true });
}
