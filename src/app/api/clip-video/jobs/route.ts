import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { readSongAudio, saveClipVideo, newClipVideoStorageKey } from "@/lib/storage";
import { buildClipVideo, MIN_CLIPS, MAX_CLIPS, MAX_CLIP_BYTES } from "@/lib/clipVideo";

async function requireUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const jobs = await db.clipVideoJob.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { song: { select: { title: true } } },
  });

  return NextResponse.json({
    jobs: jobs.map((j) => ({
      id: j.id,
      songId: j.songId,
      songTitle: j.song.title,
      status: j.status,
      errorMessage: j.errorMessage,
      clipCount: j.clipCount,
      videoUrl: j.videoUrl,
      durationSeconds: j.durationSeconds,
      createdAt: j.createdAt.toISOString(),
    })),
  });
}

async function runClipVideoJob(jobId: string, clips: Buffer[], songAudio: Buffer, songAudioFormat: string) {
  try {
    const { video, durationSeconds } = await buildClipVideo({ clips, songAudio, songAudioFormat });
    const storageKey = newClipVideoStorageKey(jobId);
    await saveClipVideo(storageKey, video);
    await db.clipVideoJob.update({
      where: { id: jobId },
      data: { status: "done", videoUrl: storageKey, durationSeconds: Math.round(durationSeconds) },
    });
  } catch (err) {
    console.error("Clip video job failed", jobId, err);
    const message = err instanceof Error ? err.message : "Clip video render failed";
    await db.clipVideoJob.update({ where: { id: jobId }, data: { status: "error", errorMessage: message } });
  }
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });

  const songId = form.get("songId");
  if (typeof songId !== "string" || !songId) {
    return NextResponse.json({ error: "songId is required" }, { status: 400 });
  }

  const clipFiles = form.getAll("clips").filter((v): v is File => v instanceof File);
  if (clipFiles.length < MIN_CLIPS || clipFiles.length > MAX_CLIPS) {
    return NextResponse.json({ error: `Upload ${MIN_CLIPS}-${MAX_CLIPS} clips` }, { status: 400 });
  }
  for (const file of clipFiles) {
    if (file.size > MAX_CLIP_BYTES) {
      return NextResponse.json({ error: `${file.name} is too large (max ${MAX_CLIP_BYTES / 1024 / 1024}MB per clip)` }, { status: 400 });
    }
  }

  const song = await db.song.findUnique({ where: { id: songId } });
  if (!song || song.userId !== userId || song.deletedAt) {
    return NextResponse.json({ error: "Song not found" }, { status: 404 });
  }

  let songAudio: Buffer;
  try {
    songAudio = await readSongAudio(song.audioUrl);
  } catch {
    return NextResponse.json({ error: "Couldn't read the song's audio file" }, { status: 500 });
  }

  const clips = await Promise.all(clipFiles.map(async (f) => Buffer.from(await f.arrayBuffer())));

  const job = await db.clipVideoJob.create({
    data: { songId, userId, status: "processing", clipCount: clips.length },
  });

  runClipVideoJob(job.id, clips, songAudio, song.format).catch((err) =>
    console.error("Background clip video job crashed", err),
  );

  return NextResponse.json({ jobId: job.id });
}
