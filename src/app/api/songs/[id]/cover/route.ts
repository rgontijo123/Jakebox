import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { saveSongThumbnail, newThumbnailStorageKey } from "@/lib/storage";
import { generateCoverArt } from "@/lib/coverArt";

/** On-demand cover regeneration, for songs created before the AI cover step
 * existed (or that fell back to the branded gradient). Reuses the exact same
 * generator the automatic path uses, just triggered manually. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { id } = await params;
  const song = await db.song.findUnique({ where: { id }, include: { generation: true } });
  const isOwnerRole = session.user.role === "owner" || session.user.role === "admin";
  if (!song || (song.userId !== session.user.id && !isOwnerRole) || song.deletedAt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const cover = await generateCoverArt({ title: song.title, styleSummary: song.generation.stylePrompt });
  if (!cover) {
    return NextResponse.json({ error: "Cover generation failed" }, { status: 500 });
  }

  const thumbnailKey = newThumbnailStorageKey(song.generationId);
  await saveSongThumbnail(thumbnailKey, cover);
  await db.song.update({ where: { id: song.id }, data: { thumbnailUrl: thumbnailKey } });

  return NextResponse.json({ ok: true });
}
