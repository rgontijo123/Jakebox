import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readSongAudio } from "@/lib/storage";
import { rangeResponse } from "@/lib/rangeResponse";

/** Announcer intro of a song that's on air. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const song = await db.song.findUnique({ where: { id }, select: { radioAt: true, deletedAt: true, radioIntroKey: true } });
  if (!song?.radioAt || song.deletedAt || !song.radioIntroKey) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return rangeResponse(req, await readSongAudio(song.radioIntroKey), "audio/mpeg", { "Cache-Control": "public, max-age=3600" });
}
