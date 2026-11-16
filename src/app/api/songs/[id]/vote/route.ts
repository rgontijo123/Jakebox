import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

/** Signed-in users vote for a public song (toggle: second call removes it). */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const userId = session.user.id;
  const { id: songId } = await params;
  const song = await db.song.findUnique({ where: { id: songId }, select: { isPublic: true, deletedAt: true } });
  if (!song?.isPublic || song.deletedAt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await db.songVote.findUnique({ where: { songId_userId: { songId, userId } } });
  if (existing) await db.songVote.delete({ where: { id: existing.id } });
  else await db.songVote.create({ data: { songId, userId } }).catch(() => null); // double-click race: unique index wins
  const votes = await db.songVote.count({ where: { songId } });
  return NextResponse.json({ voted: !existing, votes });
}
