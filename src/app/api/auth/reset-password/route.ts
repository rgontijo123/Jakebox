import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { isPasswordValid, PASSWORD_REQUIREMENTS_HINT } from "@/lib/passwordPolicy";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const token = body?.token as string | undefined;
  const password = body?.password as string | undefined;

  if (!token) {
    return NextResponse.json({ error: "Missing reset token" }, { status: 400 });
  }
  if (!password || !isPasswordValid(password)) {
    return NextResponse.json({ error: `Password requirements: ${PASSWORD_REQUIREMENTS_HINT}` }, { status: 400 });
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const resetToken = await db.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return NextResponse.json({ error: "This reset link is invalid or has expired" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.$transaction([
    db.user.update({
      where: { id: resetToken.userId },
      data: {
        passwordHash,
        // A password reset is as strong a proof of ownership as a correct
        // login -- clear any lockout from guessing attempts so the user
        // isn't still locked out right after proving they own the account.
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    }),
    db.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
