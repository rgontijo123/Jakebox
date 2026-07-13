import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { readSongAudio } from "@/lib/storage";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { id } = await params;
  const song = await db.song.findUnique({ where: { id } });
  const isOwnerRole = session.user.role === "owner" || session.user.role === "admin";
  if (!song || (song.userId !== session.user.id && !isOwnerRole) || song.deletedAt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const buffer = await readSongAudio(song.audioUrl);
  const download = new URL(req.url).searchParams.get("download") === "1";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": song.format === "wav" ? "audio/wav" : "audio/mpeg",
      "Content-Length": String(buffer.byteLength),
      ...(download
        ? { "Content-Disposition": `attachment; filename="${song.title.replace(/[^a-z0-9]/gi, "_")}.${song.format}"` }
        : {}),
    },
  });
}
