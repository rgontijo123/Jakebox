import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { getLocale } from "@/lib/i18n/server";
import { createPasswordResetUrl } from "@/lib/passwordReset";

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

  const origin = req.headers.get("origin") ?? new URL(req.url).origin;
  const resetUrl = await createPasswordResetUrl(user.id, origin);

  await sendPasswordResetEmail(user.email, resetUrl, await getLocale());

  return genericResponse;
}
