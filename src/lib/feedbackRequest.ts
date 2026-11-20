import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { sendFeedbackRequestEmail } from "@/lib/email";

const APP_URL = process.env.APP_URL ?? "https://jakeboxmusic.com";
// How long after signup the "what do you think?" email goes out.
const DELAY_MS = (Number(process.env.FEEDBACK_DELAY_HOURS) || 24) * 3600_000;
// Off unless FEEDBACK_EMAILS=on -- these go to real customers.
export const feedbackEmailsEnabled = () => process.env.FEEDBACK_EMAILS === "on";

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET not set");
  return s;
}

/** Login-free link to the form: the token is the user id + an HMAC of it. */
export function feedbackToken(userId: string) {
  const sig = createHmac("sha256", secret()).update(`feedback:${userId}`).digest("base64url").slice(0, 32);
  return `${userId}.${sig}`;
}

export function userIdFromFeedbackToken(token: string | null | undefined): string | null {
  if (!token) return null;
  const [userId, sig] = token.split(".");
  if (!userId || !sig) return null;
  const expected = feedbackToken(userId).split(".")[1];
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b) ? userId : null;
}

export const feedbackUrl = (userId: string) => `${APP_URL}/feedback?t=${feedbackToken(userId)}`;

/** Sends the request to one account and marks it, so it never repeats. */
export async function requestFeedback(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, displayName: true, locale: true, _count: { select: { songs: true } } },
  });
  if (!user) return false;
  // mark first: a crash mid-send must not turn into a second email later
  await db.user.update({ where: { id: user.id }, data: { feedbackRequestedAt: new Date() } });
  const locale = user.locale === "pt" || user.locale === "en" ? user.locale : null;
  return sendFeedbackRequestEmail(user.email, {
    locale,
    name: user.displayName,
    songs: user._count.songs,
    formUrl: feedbackUrl(user.id),
  });
}

/** Active customer accounts that signed up over DELAY ago and were never asked. */
export async function dueFeedbackUsers() {
  return db.user.findMany({
    where: {
      feedbackRequestedAt: null,
      status: "active",
      role: "user",
      createdAt: { lte: new Date(Date.now() - DELAY_MS) },
    },
    select: { id: true, email: true, createdAt: true },
    orderBy: { createdAt: "asc" },
    take: 50,
  });
}

export async function sendDueFeedbackRequests() {
  if (!feedbackEmailsEnabled()) return;
  try {
    const due = await dueFeedbackUsers();
    for (const u of due) {
      const ok = await requestFeedback(u.id).catch((err) => {
        console.error(`[feedback] request to ${u.id} failed`, err);
        return false;
      });
      console.log(`[feedback] request ${ok ? "sent" : "NOT sent"} to user ${u.id}`);
    }
  } catch (err) {
    console.error("[feedback] sweep failed", err);
  }
}
