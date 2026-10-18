import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { VideoStudioPanel } from "@/components/VideoStudioPanel";
import { ClipVideoPanel } from "@/components/ClipVideoPanel";

export default async function VideoPage() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id) redirect("/login");
  const isStaff = role === "owner" || role === "admin";

  const songs = await db.song.findMany({
    where: { userId: session.user.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, title: true, durationSeconds: true },
  });

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 gap-12">
      <div className="w-full max-w-3xl flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Your clips, your song</h1>
          <p className="text-sm text-zinc-500">
            Upload your own footage and we&apos;ll stitch it into a video for one of your songs.
          </p>
        </div>
        <ClipVideoPanel songs={songs} />
      </div>

      {isStaff && (
        <div className="w-full max-w-3xl flex flex-col gap-8 border-t border-zinc-800 pt-12">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Lyric Video</h1>
            <a href="/studio" className="text-sm underline text-zinc-400 hover:text-zinc-100">
              Go to Studio
            </a>
          </div>
          <p className="-mt-4 text-sm text-zinc-500">
            Turns a song into a Whisper-aligned captioned lyric video via the Video Studio service.
          </p>
          <VideoStudioPanel songs={songs} />
        </div>
      )}
    </main>
  );
}
