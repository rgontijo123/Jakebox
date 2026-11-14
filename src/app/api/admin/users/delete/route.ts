import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

/** Owner-only, two-step: `{ email }` returns what would be removed;
 * `{ email, confirm: true }` permanently deletes the account and every row
 * that belongs to it. Stored audio/video files are left in storage. */
export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "owner") {
    return NextResponse.json({ error: "Only the owner can delete users" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 });

  const target = await db.user.findUnique({ where: { email } });
  if (!target) return NextResponse.json({ error: "No user with that email" }, { status: 404 });
  if (target.id === session.user.id || target.role !== "user") {
    return NextResponse.json({ error: "Owner/admin accounts can't be deleted here" }, { status: 400 });
  }
  if (target.stripeSubscriptionId && target.planStatus && target.planStatus !== "canceled") {
    return NextResponse.json(
      { error: "This user has an active plan -- cancel it in Stripe first so they aren't billed again" },
      { status: 409 },
    );
  }

  const userId = target.id;
  const [songs, generations, payments, voices] = await Promise.all([
    db.song.findMany({ where: { userId }, select: { id: true } }),
    db.generation.findMany({ where: { userId }, select: { id: true } }),
    db.payment.count({ where: { userId } }),
    db.voicePersona.count({ where: { userId } }),
  ]);
  const summary = {
    email: target.email,
    createdAt: target.createdAt.toISOString(),
    songs: songs.length,
    generations: generations.length,
    payments,
    voices,
    creditBalance: target.creditBalance,
  };

  if (body?.confirm !== true) return NextResponse.json({ preview: summary });

  const songIds = songs.map((s) => s.id);
  const generationIds = generations.map((g) => g.id);
  // children first -- none of these relations cascade in the schema
  await db.$transaction([
    db.supportReport.deleteMany({ where: { OR: [{ userId }, { songId: { in: songIds } }] } }),
    db.videoStudioJob.deleteMany({ where: { OR: [{ userId }, { songId: { in: songIds } }] } }),
    db.clipVideoJob.deleteMany({ where: { OR: [{ userId }, { songId: { in: songIds } }] } }),
    db.moderationLog.deleteMany({ where: { OR: [{ userId }, { generationId: { in: generationIds } }] } }),
    db.song.deleteMany({ where: { OR: [{ userId }, { generationId: { in: generationIds } }] } }),
    db.generation.deleteMany({ where: { userId } }),
    db.creditTransaction.deleteMany({ where: { userId } }),
    db.payment.deleteMany({ where: { userId } }),
    db.stylePreset.deleteMany({ where: { userId } }),
    db.voicePersona.deleteMany({ where: { userId } }),
    db.passwordResetToken.deleteMany({ where: { userId } }),
    db.user.delete({ where: { id: userId } }),
  ]);

  return NextResponse.json({ deleted: summary });
}
