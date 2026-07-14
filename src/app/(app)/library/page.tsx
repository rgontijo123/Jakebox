import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { WorkspaceList } from "@/components/WorkspaceList";

export default async function LibraryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 gap-8">
      <div className="w-full max-w-3xl flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My library</h1>
        <a href="/create" className="text-sm underline text-zinc-400 hover:text-zinc-100">
          + New song
        </a>
      </div>
      <div className="w-full max-w-3xl">
        <WorkspaceList />
      </div>
    </main>
  );
}
