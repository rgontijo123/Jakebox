import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getVideoStatus, videoStudioUrl, VideoStudioUnavailableError, VideoStudioError } from "@/lib/videoStudio";

async function requireStaff() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  return role === "owner" || role === "admin";
}

// Refreshes one job's status from the Flask service and persists it --
// polled by the /video and /studio pages while a render is running.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireStaff())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const job = await db.videoStudioJob.findUnique({ where: { id }, include: { song: { select: { title: true } } } });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (job.status !== "running") {
    return NextResponse.json(toJson(job));
  }

  try {
    const remote = await getVideoStatus(job.name);
    if (remote.status === "done") {
      const updated = await db.videoStudioJob.update({
        where: { id },
        data: {
          status: "done",
          videoUrl: remote.videoUrl ? videoStudioUrl(remote.videoUrl) : null,
          durationSeconds: remote.durationSeconds ? Math.round(remote.durationSeconds) : null,
          promoText: remote.promoText ?? null,
          shortUrl: remote.shortReady && remote.shortUrl ? videoStudioUrl(remote.shortUrl) : null,
        },
      });
      return NextResponse.json(toJson({ ...updated, song: job.song }));
    }
    if (remote.status === "error") {
      const updated = await db.videoStudioJob.update({
        where: { id },
        data: { status: "error", errorMessage: remote.error ?? "Video Studio render failed" },
      });
      return NextResponse.json(toJson({ ...updated, song: job.song }));
    }
    // still running -- report the current stage without persisting anything new
    return NextResponse.json({ ...toJson(job), stage: remote.stage });
  } catch (err) {
    const message =
      err instanceof VideoStudioUnavailableError || err instanceof VideoStudioError
        ? err.message
        : "Status check failed";
    return NextResponse.json({ ...toJson(job), stage: null, unavailable: message });
  }
}

function toJson(job: {
  id: string;
  songId: string;
  song: { title: string };
  name: string;
  status: string;
  errorMessage: string | null;
  videoUrl: string | null;
  durationSeconds: number | null;
  promoText: string | null;
  shortUrl: string | null;
}) {
  return {
    id: job.id,
    songId: job.songId,
    songTitle: job.song.title,
    name: job.name,
    status: job.status,
    errorMessage: job.errorMessage,
    videoUrl: job.videoUrl,
    durationSeconds: job.durationSeconds,
    promoText: job.promoText,
    shortUrl: job.shortUrl,
  };
}
