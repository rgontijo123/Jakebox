import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { cutShort, getVideoStatus, videoStudioUrl, VideoStudioUnavailableError, VideoStudioError } from "@/lib/videoStudio";

async function requireStaff() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  return role === "owner" || role === "admin";
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireStaff())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const job = await db.videoStudioJob.findUnique({ where: { id } });
  if (!job || job.status !== "done") {
    return NextResponse.json({ error: "Job isn't ready yet" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const mode = body?.mode === "auto" ? "auto" : "manual";
  const start = Number(body?.start);
  const end = Number(body?.end);

  try {
    await cutShort(job.name, { mode, start, end });
    const remote = await getVideoStatus(job.name);
    const shortUrl = remote.shortReady && remote.shortUrl ? videoStudioUrl(remote.shortUrl) : null;
    await db.videoStudioJob.update({ where: { id }, data: { shortUrl } });
    return NextResponse.json({ shortUrl });
  } catch (err) {
    const message =
      err instanceof VideoStudioUnavailableError || err instanceof VideoStudioError
        ? err.message
        : "Short clip failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
