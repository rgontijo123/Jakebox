import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { VideoStudioPanel } from "@/components/VideoStudioPanel";

// Internal tool on top of the local VideoSubtitles Flask service -- see
// videoStudio.ts. Restricted to owner/admin, same as /admin.
export default async function VideoPage() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id) redirect("/login");
  if (role !== "owner" && role !== "admin") redirect("/");

  const songs = await db.song.findMany({
    where: { userId: session.user.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, title: true, durationSeconds: true },
  });

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 gap-8">
      <div className="w-full max-w-3xl flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Video</h1>
        <a href="/studio" className="text-sm underline text-zinc-400 hover:text-zinc-100">
          Go to Studio
        </a>
      </div>
      <p className="w-full max-w-3xl text-sm text-zinc-500 -mt-4">
        Turns a song into a Whisper-aligned captioned lyric video via the local Video Studio service.
        Requires <code className="text-zinc-400">python app.py</code> running in VideoSubtitles.
      </p>
      <div className="w-full max-w-3xl">
        <VideoStudioPanel songs={songs} />
      </div>
    </main>
  );
}
