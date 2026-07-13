import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { AdminGenerationRow } from "@/components/AdminGenerationRow";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== "owner" && session?.user?.role !== "admin") {
    redirect("/");
  }

  const { q } = await searchParams;

  const generations = await db.generation.findMany({
    where: q
      ? {
          OR: [
            { stylePrompt: { contains: q, mode: "insensitive" } },
            { user: { email: { contains: q, mode: "insensitive" } } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { email: true, status: true } }, songs: { select: { id: true }, take: 1 } },
  });

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 gap-6">
      <div className="w-full max-w-4xl flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <form className="flex gap-2">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by email or prompt..."
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm w-64"
          />
        </form>
      </div>

      <div className="w-full max-w-4xl flex flex-col divide-y divide-zinc-800 border border-zinc-800 rounded-md">
        {generations.length === 0 && <p className="p-4 text-sm text-zinc-500">No generations found.</p>}
        {generations.map((g) => (
          <AdminGenerationRow
            key={g.id}
            id={g.id}
            userId={g.userId}
            userEmail={g.user.email}
            userBanned={g.user.status === "banned"}
            status={g.status}
            stylePrompt={g.stylePrompt}
            createdAt={g.createdAt.toISOString()}
            songId={g.songs[0]?.id ?? null}
          />
        ))}
      </div>
    </main>
  );
}
