import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { readSongThumbnail } from "@/lib/storage";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { id } = await params;
  const song = await db.song.findUnique({ where: { id } });
  const isOwnerRole = session.user.role === "owner" || session.user.role === "admin";
  if (!song || (song.userId !== session.user.id && !isOwnerRole) || song.deletedAt || !song.thumbnailUrl) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const buffer = await readSongThumbnail(song.thumbnailUrl);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Length": String(buffer.byteLength),
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
