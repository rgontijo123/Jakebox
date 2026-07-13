import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ batchId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { batchId } = await params;
  const generations = await db.generation.findMany({
    where: { batchId, userId: session.user.id },
    include: { songs: true },
    orderBy: { createdAt: "asc" },
  });

  if (generations.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    batchId,
    stylePrompt: generations[0].stylePrompt,
    lyricsText: generations[0].lyricsText,
    generations: generations.map((g) => {
      const song = g.songs[0];
      return {
        id: g.id,
        status: g.status,
        errorMessage: g.errorMessage,
        song: song
          ? {
              id: song.id,
              title: song.title,
              durationSeconds: song.durationSeconds,
              wordTimestamps: song.wordTimestamps,
            }
          : null,
      };
    }),
  });
}
