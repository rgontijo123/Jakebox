"use client";

import { useState } from "react";

type Summary = {
  email: string;
  createdAt: string;
  songs: number;
  generations: number;
  payments: number;
  voices: number;
  creditBalance: number;
};

/** Owner-only: look a user up by email, review what will go, then confirm. */
export function AdminDeleteUser() {
  const [email, setEmail] = useState("");
  const [preview, setPreview] = useState<Summary | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function call(confirm: boolean) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, confirm }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setPreview(null);
        setMessage(data?.error ?? "Failed");
        return;
      }
      if (confirm) {
        setPreview(null);
        setEmail("");
        setMessage(`Deleted ${data.deleted.email}.`);
      } else {
        setPreview(data.preview);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-4xl flex flex-col gap-2 text-sm">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          call(false);
        }}
        className="flex items-center gap-2"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setPreview(null);
          }}
          placeholder="user to delete: user@example.com"
          required
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 flex-1"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-md border border-red-900 px-3 py-1.5 text-red-400 hover:text-red-300 disabled:opacity-50"
        >
          Delete user…
        </button>
      </form>

      {preview && (
        <div className="rounded-md border border-red-900 bg-red-950/30 p-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-zinc-300">
            Permanently delete <b>{preview.email}</b> (created {new Date(preview.createdAt).toLocaleDateString()}):{" "}
            {`${preview.songs} songs, ${preview.generations} generations, ${preview.voices} voices, ${preview.payments} payments, ${preview.creditBalance} credits.`}{" "}
            This can&apos;t be undone.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="rounded-md border border-zinc-700 px-3 py-1.5 text-zinc-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => call(true)}
              disabled={busy}
              className="rounded-md bg-red-600 px-3 py-1.5 text-white hover:bg-red-500 disabled:opacity-50"
            >
              Yes, delete
            </button>
          </div>
        </div>
      )}

      {message && <span className="text-xs text-zinc-500">{message}</span>}
    </div>
  );
}
