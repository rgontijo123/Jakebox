"use client";

import { useState } from "react";

export function AdminGenerationRow(props: {
  id: string;
  userId: string;
  userEmail: string;
  userBanned: boolean;
  userCreditBalance: number;
  status: string;
  stylePrompt: string;
  createdAt: string;
  songId: string | null;
}) {
  const [banned, setBanned] = useState(props.userBanned);
  const [balance, setBalance] = useState(props.userCreditBalance);
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);

  async function toggleBan() {
    if (!confirm(banned ? `Unban ${props.userEmail}?` : `Ban ${props.userEmail}? They won't be able to log in.`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/users/${props.userId}/ban`, { method: "POST" });
    setBusy(false);
    if (res.ok) {
      const data = await res.json();
      setBanned(data.status === "banned");
    }
  }

  async function adjustCredits() {
    const raw = prompt(`Adjust credits for ${props.userEmail} (current: ${balance}). Enter a signed amount, e.g. 500 or -100:`);
    if (raw === null) return;
    const amount = Number(raw);
    if (!Number.isInteger(amount) || amount === 0) return;
    setBusy(true);
    const res = await fetch(`/api/admin/users/${props.userId}/credits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    setBusy(false);
    if (res.ok) {
      const data = await res.json();
      setBalance(data.balance);
    }
  }

  return (
    <div className="flex flex-col gap-2 px-4 py-3 text-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate">
            <span className="text-zinc-300">{props.userEmail}</span>{" "}
            {banned && <span className="text-red-400 text-xs">(banned)</span>}
          </p>
          <p className="text-xs text-zinc-500 truncate">{props.stylePrompt}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-zinc-500">{props.status}</span>
          {props.songId && (
            <button onClick={() => setExpanded((v) => !v)} className="text-zinc-400 hover:text-zinc-100">
              {expanded ? "Hide" : "Play"}
            </button>
          )}
          <button
            onClick={adjustCredits}
            disabled={busy}
            className="text-zinc-500 hover:text-zinc-100 disabled:opacity-50"
            title="Adjust credits"
          >
            {balance} cr
          </button>
          <button
            onClick={toggleBan}
            disabled={busy}
            className="text-zinc-500 hover:text-red-400 disabled:opacity-50"
          >
            {banned ? "Unban" : "Ban"}
          </button>
        </div>
      </div>
      {expanded && props.songId && (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <audio controls autoPlay src={`/api/songs/${props.songId}/audio`} className="w-full" />
      )}
    </div>
  );
}
