"use client";

import { useState } from "react";
import { CREDIT_PACKS } from "@/lib/pricing";

export function CreditPacks() {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function buy(packId: string) {
    setError(null);
    setLoadingId(packId);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packId }),
    });
    const data = await res.json();
    if (!res.ok || !data.url) {
      setError(data.error ?? "Could not start checkout");
      setLoadingId(null);
      return;
    }
    window.location.href = data.url;
  }

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="grid sm:grid-cols-3 gap-4">
        {CREDIT_PACKS.map((pack) => (
          <div key={pack.id} className="rounded-2xl border border-zinc-800 p-5 flex flex-col gap-3">
            <p className="text-sm font-medium">{pack.name}</p>
            <p className="text-2xl font-semibold">${(pack.usdCents / 100).toFixed(0)}</p>
            <p className="text-sm text-zinc-400">{pack.credits} credits</p>
            <button
              onClick={() => buy(pack.id)}
              disabled={loadingId !== null}
              className="mt-auto rounded-full bg-[#F5B900] text-black px-4 py-2 text-sm font-medium hover:bg-[#ffcc33] transition-colors disabled:opacity-50"
            >
              {loadingId === pack.id ? "Redirecting..." : "Buy"}
            </button>
          </div>
        ))}
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
