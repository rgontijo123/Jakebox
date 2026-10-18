import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// Unlike video-studio's [id] route, this never calls out to a remote
// service -- the background job in jobs/route.ts updates the row directly
// as it progresses, so this is just a read of current DB state, polled by
// ClipVideoPanel while a job is "processing".
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const job = await db.clipVideoJob.findUnique({ where: { id }, include: { song: { select: { title: true } } } });
  if (!job || job.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: job.id,
    songId: job.songId,
    songTitle: job.song.title,
    status: job.status,
    errorMessage: job.errorMessage,
    clipCount: job.clipCount,
    videoUrl: job.videoUrl,
    durationSeconds: job.durationSeconds,
  });
}
