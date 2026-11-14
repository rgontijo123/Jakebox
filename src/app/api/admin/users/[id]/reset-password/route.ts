import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { getLocale } from "@/lib/i18n/server";
import { createPasswordResetUrl } from "@/lib/passwordReset";

/** Emails the user a reset link (the admin never sees or sets the password). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "owner" && session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const target = await db.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const origin = req.headers.get("origin") ?? new URL(req.url).origin;
  const resetUrl = await createPasswordResetUrl(target.id, origin);
  const sent = await sendPasswordResetEmail(target.email, resetUrl, await getLocale());
  if (!sent) return NextResponse.json({ error: "Email could not be sent" }, { status: 502 });

  return NextResponse.json({ ok: true });
}
