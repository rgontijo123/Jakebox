import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { readSongAudio } from "@/lib/storage";
import {
  studioNameFor,
  submitVideoJob,
  VideoStudioUnavailableError,
  VideoStudioError,
} from "@/lib/videoStudio";

// /video and /studio are internal tools on top of a local, single-user Flask
// service (see videoStudio.ts) -- restricted to owner/admin, same as /admin.
async function requireStaff() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "owner" && role !== "admin") return null;
  return session!.user!.id!;
}

export async function GET() {
  const userId = await requireStaff();
  if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const jobs = await db.videoStudioJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { song: { select: { title: true } } },
  });

  return NextResponse.json({
    jobs: jobs.map((j) => ({
      id: j.id,
      songId: j.songId,
      songTitle: j.song.title,
      name: j.name,
      status: j.status,
      errorMessage: j.errorMessage,
      videoUrl: j.videoUrl,
      durationSeconds: j.durationSeconds,
      promoText: j.promoText,
      shortUrl: j.shortUrl,
      createdAt: j.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: Request) {
  const userId = await requireStaff();
  if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const songId = body?.songId as string | undefined;
  if (!songId) return NextResponse.json({ error: "songId is required" }, { status: 400 });

  // Everything below used to have a gap between the auth/validation checks
  // and submitVideoJob's own try/catch -- name generation, the "existing
  // running job" lookup, and the job row insert (which can hit the unique
  // constraint on `name` if a prior attempt for this exact song already has
  // a row, running or not) were all unguarded, so any failure there surfaced
  // to the client as an unhandled 500/HTML page instead of JSON -- which is
  // exactly what produced the generic "Failed to start video render"
  // fallback on the client with no way to tell what actually broke.
  try {
    const song = await db.song.findUnique({ where: { id: songId }, include: { generation: true } });
    if (!song || song.deletedAt) return NextResponse.json({ error: "Song not found" }, { status: 404 });

    const existing = await db.videoStudioJob.findFirst({ where: { songId, status: "running" } });
    if (existing) return NextResponse.json({ jobId: existing.id });

    const name = studioNameFor(song.title, song.id);
    const language = song.generation.language.startsWith("pt") ? "pt" : "en";

    let audio: Buffer;
    try {
      audio = await readSongAudio(song.audioUrl);
    } catch {
      return NextResponse.json({ error: "Couldn't read the song's audio file" }, { status: 500 });
    }

    // A previous attempt for this exact song (running, done, or error)
    // already claimed this deterministic `name` -- reuse/replace that row
    // instead of letting the unique-constraint insert throw.
    const priorJob = await db.videoStudioJob.findUnique({ where: { name } });
    const job = priorJob
      ? await db.videoStudioJob.update({
          where: { id: priorJob.id },
          data: { status: "running", errorMessage: null, videoUrl: null },
        })
      : await db.videoStudioJob.create({ data: { songId, userId, name, status: "running" } });

    try {
      await submitVideoJob({
        name,
        displayTitle: song.title,
        language,
        lyricsText: song.generation.lyricsText,
        audio,
        audioFilename: `${name}.${song.format}`,
      });
    } catch (err) {
      const message =
        err instanceof VideoStudioUnavailableError || err instanceof VideoStudioError
          ? err.message
          : "Video Studio submission failed";
      await db.videoStudioJob.update({
        where: { id: job.id },
        data: { status: "error", errorMessage: message },
      });
      return NextResponse.json({ error: message }, { status: 502 });
    }

    return NextResponse.json({ jobId: job.id });
  } catch (err) {
    console.error("POST /api/video-studio/jobs failed", err);
    const message = err instanceof Error ? err.message : "Failed to start video render";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
