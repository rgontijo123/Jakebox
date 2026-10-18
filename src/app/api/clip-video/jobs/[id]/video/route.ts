import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { readClipVideo } from "@/lib/storage";
import { rangeResponse } from "@/lib/rangeResponse";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const job = await db.clipVideoJob.findUnique({ where: { id } });
  if (!job || job.userId !== session.user.id || !job.videoUrl) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const buffer = await readClipVideo(job.videoUrl);
  const download = new URL(req.url).searchParams.get("download") === "1";

  return rangeResponse(req, buffer, "video/mp4", {
    ...(download ? { "Content-Disposition": `attachment; filename="clip-video-${job.id}.mp4"` } : {}),
  });
}
