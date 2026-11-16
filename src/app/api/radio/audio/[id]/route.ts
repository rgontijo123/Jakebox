import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readSongAudio } from "@/lib/storage";
import { rangeResponse } from "@/lib/rangeResponse";

/** Public audio for songs on Rádio Jakebox only -- anything not on air 404s. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const song = await db.song.findUnique({ where: { id } });
  if (!song || !song.radioAt || song.deletedAt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const buffer = await readSongAudio(song.audioUrl);
  const contentType = song.format === "wav" ? "audio/wav" : song.format === "ogg" ? "audio/ogg" : "audio/mpeg";
  return rangeResponse(req, buffer, contentType, { "Cache-Control": "public, max-age=3600" });
}
