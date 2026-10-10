import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = (body?.email as string | undefined)?.trim().toLowerCase();

  // Always respond the same way whether or not the email exists --
  // otherwise this endpoint becomes a way to enumerate registered emails.
  const genericResponse = NextResponse.json({
    ok: true,
    message: "If an account exists for that email, a reset link has been sent.",
  });

  if (!email) return genericResponse;

  const user = await db.user.findUnique({ where: { email } });
  if (!user) return genericResponse;

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  await db.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  const origin = req.headers.get("origin") ?? new URL(req.url).origin;
  const resetUrl = `${origin}/reset-password/${rawToken}`;

  await sendPasswordResetEmail(user.email, resetUrl);

  return genericResponse;
}
