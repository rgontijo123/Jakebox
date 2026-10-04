import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { saveLinks, VideoStudioUnavailableError, VideoStudioError } from "@/lib/videoStudio";

async function requireStaff() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  return role === "owner" || role === "admin";
}

// NOTE: VideoSubtitles stores spotify_url/youtube_url as one global config,
// not per-song -- this saves them for the whole Flask app, not just this job.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireStaff())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const job = await db.videoStudioJob.findUnique({ where: { id } });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const spotifyUrl = (body?.spotifyUrl as string | undefined) ?? "";
  const youtubeUrl = (body?.youtubeUrl as string | undefined) ?? "";

  try {
    await saveLinks(job.name, { spotifyUrl, youtubeUrl });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof VideoStudioUnavailableError || err instanceof VideoStudioError
        ? err.message
        : "Saving links failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
