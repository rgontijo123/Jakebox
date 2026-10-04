"use client";

import { useState } from "react";

export function AdminCreditLookup() {
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("500");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/admin/users/credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, amount: Number(amount) }),
    });
    const data = await res.json().catch(() => null);
    setBusy(false);
    setMessage(res.ok ? `${data.email} now has ${data.balance} credits.` : (data?.error ?? "Failed"));
  }

  return (
    <form onSubmit={submit} className="w-full max-w-4xl flex items-center gap-2 text-sm">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="user@example.com"
        required
        className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 flex-1"
      />
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="amount"
        required
        className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 w-28"
      />
      <button
        type="submit"
        disabled={busy}
        className="rounded-md border border-zinc-700 px-3 py-1.5 text-zinc-300 hover:text-zinc-100 disabled:opacity-50"
      >
        Grant credits
      </button>
      {message && <span className="text-xs text-zinc-500">{message}</span>}
    </form>
  );
}
