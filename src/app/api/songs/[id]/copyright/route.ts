import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { generateCopyrightPdf } from "@/lib/copyright";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const authorName = song.user.displayName ?? song.user.email;
  const publishDate = song.createdAt.toISOString().slice(0, 10);

  const pdf = await generateCopyrightPdf({
    title: song.title,
    authorName,
    publishDate,
    lyricsText: song.generation.lyricsText,
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(pdf.byteLength),
      "Content-Disposition": `attachment; filename="${song.title.replace(/[^a-z0-9]/gi, "_")}_copyright.pdf"`,
    },
  });
}
