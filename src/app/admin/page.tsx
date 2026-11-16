import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { AdminUserList } from "@/components/AdminUserList";
import { AdminSearch } from "@/components/AdminSearch";
import { getT } from "@/lib/i18n/server";

const PAGE_SIZE = 100;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== "owner" && session?.user?.role !== "admin") {
    redirect("/");
  }
  const { t } = await getT();
  const q = (await searchParams).q?.trim();

  const where = q
    ? {
        OR: [
          { email: { contains: q, mode: "insensitive" as const } },
          { displayName: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : undefined;
  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        status: true,
        createdAt: true,
        creditBalance: true,
        songQuota: true,
        planId: true,
        planStatus: true,
        _count: { select: { songs: { where: { deletedAt: null } } } },
      },
    }),
    db.user.count({ where }),
  ]);

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 gap-6">
      <div className="w-full max-w-4xl flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t("nav_admin")}</h1>
          <p className="text-sm text-zinc-500">{total === 1 ? t("admin_users_one") : t("admin_users_total", { n: total })}</p>
        </div>
        <AdminSearch initial={q?.trim() ?? ""} />
      </div>

      <AdminUserList
        isOwner={session?.user?.role === "owner"}
        users={users.map(({ _count, createdAt, ...u }) => ({
          ...u,
          createdAt: createdAt.toISOString(),
          songCount: _count.songs,
        }))}
      />
    </main>
  );
}
