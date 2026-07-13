import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { id } = await params;
  const generation = await db.generation.findUnique({
    where: { id },
    include: { songs: true },
  });

  if (!generation || generation.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: generation.id,
    status: generation.status,
    stylePrompt: generation.stylePrompt,
    errorMessage: generation.errorMessage,
    creditsCharged: generation.creditsCharged,
    creditsRefunded: generation.creditsRefunded,
    song: generation.songs[0]
      ? {
          id: generation.songs[0].id,
          title: generation.songs[0].title,
          durationSeconds: generation.songs[0].durationSeconds,
        }
      : null,
  });
}
