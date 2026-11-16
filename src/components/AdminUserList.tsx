"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { translateApiError } from "@/lib/i18n/apiErrors";

export type AdminUser = {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  status: string;
  createdAt: string;
  creditBalance: number;
  songQuota: number;
  planId: string | null;
  planStatus: string | null;
  songCount: number;
};

type Panel = "edit" | "delete" | null;

async function post(url: string, method: "POST" | "PATCH", body?: object) {
  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, data };
  } catch {
    return { ok: false, data: null };
  }
}

function UserRow({ user, isOwner, onDeleted }: { user: AdminUser; isOwner: boolean; onDeleted: () => void }) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [panel, setPanel] = useState<Panel>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [displayName, setDisplayName] = useState(user.displayName ?? "");
  const [songQuota, setSongQuota] = useState(String(user.songQuota));
  const [creditDelta, setCreditDelta] = useState("0");

  const isStaff = user.role !== "user";
  const banned = user.status === "banned";
  const hasPlan = !!user.planId && user.planStatus !== "canceled";

  async function run(action: () => Promise<{ ok: boolean; data: { error?: string } | null }>, success: string) {
    setBusy(true);
    setMessage(null);
    const { ok, data } = await action();
    setBusy(false);
    if (!ok) {
      setMessage({ text: translateApiError(data?.error, t, "err_generic"), error: true });
      return false;
    }
    setMessage({ text: success });
    router.refresh();
    return true;
  }

  const btn = "rounded-md border border-zinc-700 px-2.5 py-1 text-xs text-zinc-300 hover:text-zinc-100 disabled:opacity-40";

  return (
    <div className="flex flex-col gap-3 px-4 py-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium truncate">
            {user.email}
            {user.displayName && <span className="text-zinc-500 font-normal"> · {user.displayName}</span>}
          </p>
          <p className="text-xs text-zinc-500 flex flex-wrap gap-x-2">
            <span>{new Date(user.createdAt).toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US")}</span>
            <span>· {t("admin_songs_n", { n: user.songCount })}</span>
            <span>· {t("admin_credits_n", { n: user.creditBalance })}</span>
            <span>· {t("admin_quota_n", { n: user.songQuota })}</span>
            {hasPlan && <span className="text-[#F5B900]">· {t("admin_plan", { plan: user.planId! })}</span>}
            {isStaff && <span className="text-sky-400">· {user.role}</span>}
            {banned && <span className="text-red-400">· {t("admin_banned")}</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button className={btn} disabled={busy} onClick={() => setPanel(panel === "edit" ? null : "edit")}>
            {t("admin_edit")}
          </button>
          <button
            className={btn}
            disabled={busy}
            onClick={() => run(() => post(`/api/admin/users/${user.id}/reset-password`, "POST"), t("admin_reset_sent"))}
          >
            {t("admin_send_reset")}
          </button>
          {user.role !== "owner" && (
            <button
              className={btn}
              disabled={busy}
              onClick={() =>
                run(() => post(`/api/admin/users/${user.id}/ban`, "POST"), banned ? t("admin_unbanned") : t("admin_banned_done"))
              }
            >
              {banned ? t("admin_unban") : t("admin_ban")}
            </button>
          )}
          {isOwner && !isStaff && (
            <button
              className="rounded-md border border-red-900 px-2.5 py-1 text-xs text-red-400 hover:text-red-300 disabled:opacity-40"
              disabled={busy}
              onClick={() => setPanel(panel === "delete" ? null : "delete")}
            >
              {t("admin_delete")}
            </button>
          )}
        </div>
      </div>

      {panel === "edit" && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const ok = await run(
              () =>
                post(`/api/admin/users/${user.id}`, "PATCH", {
                  displayName,
                  songQuota: Number(songQuota),
                  creditDelta: Number(creditDelta),
                }),
              t("admin_saved"),
            );
            if (ok) {
              setCreditDelta("0");
              setPanel(null);
            }
          }}
          className="grid sm:grid-cols-4 gap-2 items-end rounded-md border border-zinc-800 p-3"
        >
          <label className="flex flex-col gap-1 text-xs text-zinc-400 sm:col-span-2">
            {t("contact_name")}
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            {t("admin_quota_label")}
            <input
              type="number"
              min={0}
              value={songQuota}
              onChange={(e) => setSongQuota(e.target.value)}
              className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            {t("admin_credit_delta_label")}
            <input
              type="number"
              value={creditDelta}
              onChange={(e) => setCreditDelta(e.target.value)}
              className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100"
            />
          </label>
          <div className="sm:col-span-4 flex gap-2">
            <button type="submit" disabled={busy} className="rounded-md bg-[#F5B900] px-3 py-1.5 text-xs font-medium text-black disabled:opacity-50">
              {t("admin_save")}
            </button>
            <button type="button" onClick={() => setPanel(null)} className={btn}>
              {t("admin_cancel")}
            </button>
          </div>
        </form>
      )}

      {panel === "delete" && (
        <div className="rounded-md border border-red-900 bg-red-950/30 p-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-zinc-300">
            {hasPlan
              ? t("admin_delete_has_plan")
              : t("admin_delete_confirm", { email: user.email, songs: user.songCount, credits: user.creditBalance })}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPanel(null)} className={btn}>
              {t("admin_cancel")}
            </button>
            {!hasPlan && (
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  const ok = await run(
                    () => post("/api/admin/users/delete", "POST", { email: user.email, confirm: true }),
                    t("admin_deleted"),
                  );
                  if (ok) onDeleted();
                }}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-500 disabled:opacity-50"
              >
                {t("admin_delete_yes")}
              </button>
            )}
          </div>
        </div>
      )}

      {message && <p className={`text-xs ${message.error ? "text-red-400" : "text-green-400"}`}>{message.text}</p>}
    </div>
  );
}

export function AdminUserList({ users, isOwner }: { users: AdminUser[]; isOwner: boolean }) {
  const { t } = useLocale();
  // hide a deleted row right away instead of waiting for the server refresh
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const visible = users.filter((u) => !deletedIds.includes(u.id));
  return (
    <div className="w-full max-w-4xl flex flex-col divide-y divide-zinc-800 border border-zinc-800 rounded-md">
      {visible.length === 0 && <p className="p-4 text-sm text-zinc-500">{t("admin_no_users")}</p>}
      {visible.map((u) => (
        <UserRow key={u.id} user={u} isOwner={isOwner} onDeleted={() => setDeletedIds((ids) => [...ids, u.id])} />
      ))}
    </div>
  );
}
