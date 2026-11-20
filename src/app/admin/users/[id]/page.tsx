import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getLocale } from "@/lib/i18n/server";
import { isStaffRole } from "@/lib/staff";

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border border-zinc-800 px-3 py-2">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}

export const metadata = { title: "Admin · Jakebox", robots: { index: false } };

/** Everything staff needs to know about one account: profile, what they
 * created (and what failed), payments and their feedback answers. */
export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!isStaffRole(session?.user?.role)) redirect("/");
  const pt = (await getLocale()) === "pt";
  const L = (ptText: string, enText: string) => (pt ? ptText : enText);
  const fmt = (d: Date | null | undefined) =>
    d ? d.toLocaleString(pt ? "pt-BR" : "en-US", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Prague" }) : "-";

  const { id } = await params;
  const user = await db.user.findUnique({
    where: { id },
    include: {
      songs: { orderBy: { createdAt: "desc" }, take: 200, include: { generation: true } },
      generations: {
        where: { status: { not: "completed" } },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      payments: { orderBy: { createdAt: "desc" }, take: 50 },
      feedbacks: { orderBy: { createdAt: "desc" } },
      _count: { select: { generations: true } },
    },
  });
  if (!user) notFound();

  const liveSongs = user.songs.filter((s) => !s.deletedAt);
  const paid = user.payments.filter((p) => p.status === "completed");
  const signIn = user.passwordHash ? L("e-mail e senha", "email + password") : "Google / Facebook";

  const section = "w-full max-w-4xl flex flex-col gap-3";
  const h2 = "text-lg font-semibold";

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-12 gap-10">
      <div className={section}>
        <Link href="/admin" className="text-xs text-zinc-500 hover:text-zinc-300">
          ← {L("Voltar para usuários", "Back to users")}
        </Link>
        <div>
          <h1 className="text-2xl font-semibold break-all">{user.displayName || user.email}</h1>
          {user.displayName && <p className="text-sm text-zinc-400 break-all">{user.email}</p>}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Stat label={L("Cadastro", "Signed up")} value={fmt(user.createdAt)} />
          <Stat label={L("Login", "Sign-in")} value={signIn} />
          <Stat label={L("Idioma", "Language")} value={user.locale ?? "-"} />
          <Stat label={L("Status", "Status")} value={`${user.role} · ${user.status}`} />
          <Stat label={L("Músicas", "Songs")} value={liveSongs.length} />
          <Stat label={L("Gerações", "Generations")} value={user._count.generations} />
          <Stat label={L("Músicas grátis/plano", "Free/plan songs")} value={user.songQuota} />
          <Stat label={L("Créditos", "Credits")} value={user.creditBalance} />
          <Stat
            label={L("Plano", "Plan")}
            value={user.planId ? `${user.planId} (${user.planStatus ?? "-"})` : L("nenhum", "none")}
          />
          <Stat label={L("Pagamentos", "Payments")} value={paid.length} />
          <Stat label={L("Pedido de feedback", "Feedback asked")} value={fmt(user.feedbackRequestedAt)} />
          <Stat label={L("Respostas de feedback", "Feedback answers")} value={user.feedbacks.length} />
        </div>
      </div>

      <div className={section}>
        <h2 className={h2}>Feedback</h2>
        {user.feedbacks.length === 0 && <p className="text-sm text-zinc-500">{L("Ainda não respondeu.", "No answers yet.")}</p>}
        {user.feedbacks.map((f) => (
          <div key={f.id} className="rounded-md border border-zinc-800 p-3 text-sm flex flex-col gap-1">
            <p className="text-xs text-zinc-500">
              {fmt(f.createdAt)}{" "}
              {f.rating && <span className="text-[#F5B900] text-base">{"★".repeat(f.rating) + "☆".repeat(5 - f.rating)}</span>}
            </p>
            {f.liked && (
              <p className="whitespace-pre-wrap">
                <b>{L("Gostou:", "Liked:")}</b> {f.liked}
              </p>
            )}
            {f.improve && (
              <p className="whitespace-pre-wrap">
                <b>{L("Melhorar:", "Improve:")}</b> {f.improve}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className={section}>
        <h2 className={h2}>
          {L("Músicas", "Songs")} ({liveSongs.length})
        </h2>
        {user.songs.length === 0 && <p className="text-sm text-zinc-500">{L("Nenhuma música ainda.", "No songs yet.")}</p>}
        {user.songs.map((s) => (
          <details key={s.id} className="rounded-md border border-zinc-800 p-3 text-sm">
            <summary className="cursor-pointer flex flex-wrap items-center gap-3 list-none">
              {s.thumbnailUrl && !s.deletedAt ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/api/songs/${s.id}/thumbnail`} alt="" className="w-12 h-12 rounded object-cover" />
              ) : (
                <div className="w-12 h-12 rounded bg-zinc-800" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">
                  {s.title}
                  {s.deletedAt && <span className="text-red-400 font-normal"> · {L("apagada", "deleted")}</span>}
                  {s.isPublic && <span className="text-sky-400 font-normal"> · 🌐</span>}
                  {s.radioAt && <span className="text-amber-400 font-normal"> · 📻</span>}
                </p>
                <p className="text-xs text-zinc-500 truncate">
                  {fmt(s.createdAt)} · {Math.floor(s.durationSeconds / 60)}:{String(s.durationSeconds % 60).padStart(2, "0")} ·{" "}
                  {s.generation.instrumental ? L("instrumental", "instrumental") : s.generation.language} ·{" "}
                  {s.generation.stylePrompt}
                </p>
              </div>
            </summary>
            <div className="mt-3 flex flex-col gap-2">
              {!s.deletedAt && <audio controls preload="none" src={`/api/songs/${s.id}/audio`} className="w-full" />}
              <p className="text-xs text-zinc-400">
                <b>{L("Estilo:", "Style:")}</b> {s.generation.stylePrompt}
              </p>
              {s.generation.lyricsText && (
                <pre className="whitespace-pre-wrap text-xs text-zinc-300 font-sans rounded bg-zinc-900 p-3 max-h-80 overflow-auto">
                  {s.generation.lyricsText}
                </pre>
              )}
            </div>
          </details>
        ))}
      </div>

      {user.generations.length > 0 && (
        <div className={section}>
          <h2 className={h2}>{L("Gerações com problema / em andamento", "Failed / in-progress generations")}</h2>
          {user.generations.map((g) => (
            <div key={g.id} className="rounded-md border border-zinc-800 p-3 text-sm flex flex-col gap-1">
              <p className="text-xs text-zinc-500">
                {fmt(g.createdAt)} ·{" "}
                <span className={g.status === "failed" || g.status === "rejected_moderation" ? "text-red-400" : "text-amber-400"}>
                  {g.status}
                </span>
                {g.errorMessage && <> · {g.errorMessage}</>}
              </p>
              <p className="text-xs text-zinc-400 truncate">{g.stylePrompt}</p>
              {g.lyricsText && (
                <details>
                  <summary className="cursor-pointer text-xs text-zinc-500">{L("Ver letra", "Show lyrics")}</summary>
                  <pre className="whitespace-pre-wrap text-xs text-zinc-300 font-sans rounded bg-zinc-900 p-3 mt-2">{g.lyricsText}</pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}

      <div className={section}>
        <h2 className={h2}>{L("Pagamentos", "Payments")}</h2>
        {user.payments.length === 0 && <p className="text-sm text-zinc-500">{L("Nenhum pagamento.", "No payments.")}</p>}
        {user.payments.map((p) => (
          <p key={p.id} className="text-sm rounded-md border border-zinc-800 px-3 py-2">
            {fmt(p.createdAt)} · {(p.amountUsdCents / 100).toFixed(2)} {p.currency.toUpperCase()} · {p.status}
            {p.songsGranted > 0 && <> · {p.songsGranted} {L("músicas", "songs")}</>}
            {p.creditsPurchased > 0 && <> · {p.creditsPurchased} {L("créditos", "credits")}</>}
          </p>
        ))}
      </div>
    </main>
  );
}
