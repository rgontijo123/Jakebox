import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { WorkspaceList } from "@/components/WorkspaceList";
import { getT } from "@/lib/i18n/server";

export default async function LibraryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { t } = await getT();

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 gap-8">
      <div className="w-full max-w-3xl flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("library_title")}</h1>
        <a href="/create" className="text-sm underline text-zinc-400 hover:text-zinc-100">
          {t("library_new_song")}
        </a>
      </div>
      <div className="w-full max-w-3xl">
        <WorkspaceList />
      </div>
    </main>
  );
}
