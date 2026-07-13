import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { LibraryList } from "@/components/LibraryList";

export default async function LibraryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const songs = await db.song.findMany({
    where: { userId: session.user.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { generation: { select: { stylePrompt: true } } },
  });

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 gap-8">
      <div className="w-full max-w-2xl flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My library</h1>
        <a href="/create" className="text-sm underline text-zinc-400 hover:text-zinc-100">
          + New song
        </a>
      </div>

      <div className="w-full max-w-2xl">
        {songs.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No songs yet. <a href="/create" className="underline">Create your first one</a>.
          </p>
        ) : (
          <LibraryList
            songs={songs.map((s) => ({
              id: s.id,
              title: s.title,
              stylePrompt: s.generation.stylePrompt,
              durationSeconds: s.durationSeconds,
              createdAt: s.createdAt.toISOString(),
            }))}
          />
        )}
      </div>
    </main>
  );
}
