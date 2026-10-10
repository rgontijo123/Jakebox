import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Lets the login page tell "wrong password" apart from "account locked"
// without threading that distinction through NextAuth's own error-code
// plumbing (which collapses custom Credentials errors for security reasons).
// Revealing lock status for an email is an accepted, minor enumeration
// trade-off here -- the same one most consumer apps make for this UX.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = (body?.email as string | undefined)?.trim().toLowerCase();
  if (!email) return NextResponse.json({ locked: false });

  const user = await db.user.findUnique({ where: { email }, select: { lockedUntil: true } });
  const locked = !!user?.lockedUntil && user.lockedUntil > new Date();

  return NextResponse.json({ locked, lockedUntil: locked ? user!.lockedUntil : null });
}
