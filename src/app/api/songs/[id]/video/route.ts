import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { readSongAudio, readSongVideo, saveSongVideo, newVideoStorageKey, saveSongThumbnail, newThumbnailStorageKey } from "@/lib/storage";
import { generateSongVideo } from "@/lib/video";
import type { WordTimestamp } from "@/lib/lyrics";
import { rangeResponse } from "@/lib/rangeResponse";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { id } = await params;
  const song = await db.song.findUnique({ where: { id } });
  const isOwnerRole = session.user.role === "owner" || session.user.role === "admin";
  if (!song || (song.userId !== session.user.id && !isOwnerRole) || song.deletedAt || !song.videoUrl) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const buffer = await readSongVideo(song.videoUrl);
  const download = new URL(req.url).searchParams.get("download") === "1";

  return rangeResponse(req, buffer, "video/mp4", {
    ...(download
      ? { "Content-Disposition": `attachment; filename="${song.title.replace(/[^a-z0-9]/gi, "_")}.mp4"` }
      : {}),
  });
}

/** On-demand video generation for songs created before the automatic video
 * step existed, or whose automatic attempt failed (see the best-effort catch
 * in /api/generations -- a video failure never blocks the song itself, so
 * some songs are left without one). Reuses the exact same renderer the
 * automatic path uses, just triggered manually and synchronously instead of
 * fire-and-forget after generation. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { id } = await params;
  const song = await db.song.findUnique({ where: { id }, include: { generation: true, user: true } });
  const isOwnerRole = session.user.role === "owner" || session.user.role === "admin";
  if (!song || (song.userId !== session.user.id && !isOwnerRole) || song.deletedAt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const audio = await readSongAudio(song.audioUrl);
    const { video, thumbnail } = await generateSongVideo({
      audio,
      title: song.title,
      styleSummary: song.generation.stylePrompt,
      authorName: song.user.displayName ?? song.user.email,
      language: song.generation.language,
      lyricsText: song.generation.lyricsText,
      wordTimestamps: (song.wordTimestamps as unknown as WordTimestamp[] | null) ?? undefined,
    });
    const videoKey = newVideoStorageKey(song.generationId);
    const thumbnailKey = newThumbnailStorageKey(song.generationId);
    await saveSongVideo(videoKey, video);
    await saveSongThumbnail(thumbnailKey, thumbnail);
    await db.song.update({ where: { id: song.id }, data: { videoUrl: videoKey, thumbnailUrl: thumbnailKey } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("On-demand video generation failed", err);
    return NextResponse.json({ error: "Video generation failed" }, { status: 500 });
  }
}
