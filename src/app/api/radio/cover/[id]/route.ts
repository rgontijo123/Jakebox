import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readSongThumbnail } from "@/lib/storage";

/** Public cover for songs on Rádio Jakebox or the public /explore page. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const song = await db.song.findUnique({ where: { id } });
  if (!song || !(song.radioAt || song.isPublic) || song.deletedAt || !song.thumbnailUrl) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const buffer = await readSongThumbnail(song.thumbnailUrl);
  return new NextResponse(new Uint8Array(buffer), {
    headers: { "Content-Type": "image/jpeg", "Content-Length": String(buffer.byteLength), "Cache-Control": "public, max-age=3600" },
  });
}
