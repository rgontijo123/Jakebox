"use client";

import { useState } from "react";
import { CREDIT_PACKS } from "@/lib/pricing";

// Keep in sync with CREDITS_PER_GENERATION in src/lib/credits.ts -- can't
// import it directly, that module pulls in the server-only Prisma client.
const CREDITS_PER_GENERATION = 100;

const PACK_TAGLINE: Record<string, string> = {
  starter: "Try it out",
  standard: "Most popular",
  pro: "For power users",
};

const PACK_FEATURES = [
  "Full song generation: audio + an auto-made vertical video clip",
  "Works with voice cloning and reference-song remixing too",
  "Failed generations are refunded automatically",
  "Credits never expire",
];

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
        {CREDIT_PACKS.map((pack) => {
          const songs = Math.floor(pack.credits / CREDITS_PER_GENERATION);
          const perSong = pack.usdCents / 100 / songs;
          const isPopular = pack.id === "standard";

          return (
            <div
              key={pack.id}
              className={`relative rounded-2xl border p-5 flex flex-col gap-4 ${
                isPopular
                  ? "border-[#F5B900] bg-gradient-to-b from-[#F5B900]/10 to-transparent"
                  : "border-zinc-800"
              }`}
            >
              {isPopular && (
                <span className="absolute -top-3 left-5 rounded-full bg-[#F5B900] text-black text-xs font-semibold px-3 py-1">
                  MOST POPULAR
                </span>
              )}

              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  {PACK_TAGLINE[pack.id] ?? pack.name}
                </p>
                <p className="text-lg font-semibold">{pack.name}</p>
              </div>

              <div>
                <span className="text-3xl font-semibold">${(pack.usdCents / 100).toFixed(0)}</span>
                <span className="text-sm text-zinc-500"> one-time</span>
              </div>

              <div className="rounded-lg bg-zinc-900/60 px-3 py-2">
                <p className="text-sm text-zinc-100">
                  <span className="font-medium">{pack.credits.toLocaleString()}</span> credits
                </p>
                <p className="text-xs text-zinc-500">
                  ≈ {songs} songs at 60s (longer songs cost more) · ${perSong.toFixed(2)}/song
                </p>
              </div>

              <ul className="flex flex-col gap-1.5 text-xs text-zinc-400">
                {PACK_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-1.5">
                    <span className="text-[#F5B900] shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => buy(pack.id)}
                disabled={loadingId !== null}
                className={`mt-auto rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                  isPopular
                    ? "bg-[#F5B900] text-black hover:bg-[#ffcc33]"
                    : "bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                }`}
              >
                {loadingId === pack.id ? "Redirecting..." : "Buy"}
              </button>
            </div>
          );
        })}
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
