import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { userIdFromFeedbackToken } from "@/lib/feedbackRequest";
import { sendFeedbackToOwner } from "@/lib/email";

const MAX_TEXT = 4000;
const text = (v: unknown) => (typeof v === "string" ? v.trim().slice(0, MAX_TEXT) : "");

/** The /feedback form: identified by the emailed link's token, or the
 * logged-in session when opened from the site. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const userId =
    userIdFromFeedbackToken(typeof body?.t === "string" ? body.t : null) ?? (await auth())?.user?.id ?? null;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rating = Number(body?.rating);
  const liked = text(body?.liked);
  const improve = text(body?.improve);
  const validRating = Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null;
  if (!validRating && !liked && !improve) return NextResponse.json({ error: "empty" }, { status: 400 });

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, displayName: true, _count: { select: { songs: true, feedbacks: true } } },
  });
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  // a person writing a lot is welcome; a script hammering the link isn't
  if (user._count.feedbacks >= 20) return NextResponse.json({ error: "too_many" }, { status: 429 });

  await db.feedback.create({ data: { userId, rating: validRating, liked: liked || null, improve: improve || null } });
  await sendFeedbackToOwner({
    email: user.email,
    name: user.displayName,
    songs: user._count.songs,
    rating: validRating,
    liked,
    improve,
  }).catch((err) => console.error("feedback email to owner failed", err));
  return NextResponse.json({ ok: true });
}
