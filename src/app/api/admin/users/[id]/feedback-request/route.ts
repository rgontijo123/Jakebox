import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isStaffRole } from "@/lib/staff";
import { requestFeedback } from "@/lib/feedbackRequest";

/** Staff-triggered "what do you think?" email to one account (works even
 * with the automatic FEEDBACK_EMAILS sweep off). */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!isStaffRole(session?.user?.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const ok = await requestFeedback(id);
  if (!ok) return NextResponse.json({ error: "send_failed" }, { status: 502 });
  return NextResponse.json({ ok: true, sentAt: new Date().toISOString() });
}
