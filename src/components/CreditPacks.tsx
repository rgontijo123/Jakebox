"use client";

import { useState } from "react";
import { CREDIT_PACKS } from "@/lib/pricing";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { DictionaryKey } from "@/lib/i18n/translations";

// Keep in sync with CREDITS_PER_GENERATION in src/lib/credits.ts -- can't
// import it directly, that module pulls in the server-only Prisma client.
const CREDITS_PER_GENERATION = 100;

const PACK_TAGLINE_KEY: Record<string, DictionaryKey> = {
  starter: "pack_tagline_starter",
  standard: "pack_tagline_standard",
  pro: "pack_tagline_pro",
};

const PACK_FEATURE_KEYS: DictionaryKey[] = ["pack_feature_1", "pack_feature_2", "pack_feature_3", "pack_feature_4"];

export function CreditPacks() {
  const { t } = useLocale();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function buy(packId: string) {
    setError(null);
    setLoadingId(packId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      // The server can fail before ever reaching this route (a Render 502,
      // a proxy timeout) and hand back an HTML error page instead of JSON --
      // res.json() throws on that. Previously nothing caught it, so
      // setLoadingId(null) below never ran and the button stayed stuck on
      // "Redirecting..." forever.
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.url) {
        setError(data?.error ?? t("pack_checkout_error"));
        return;
      }
      window.location.href = data.url;
    } catch {
      setError(t("pack_checkout_unexpected"));
    } finally {
      setLoadingId(null);
    }
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
                  {t("pack_most_popular_badge")}
                </span>
              )}

              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  {t(PACK_TAGLINE_KEY[pack.id] ?? "pack_tagline_starter")}
                </p>
                <p className="text-lg font-semibold">{pack.name}</p>
              </div>

              <div>
                <span className="text-3xl font-semibold">${(pack.usdCents / 100).toFixed(0)}</span>
                <span className="text-sm text-zinc-500"> {t("pack_one_time")}</span>
              </div>

              <div className="rounded-lg bg-zinc-900/60 px-3 py-2">
                <p className="text-sm text-zinc-100">
                  <span className="font-medium">{pack.credits.toLocaleString()}</span> {t("pack_credits")}
                </p>
                <p className="text-xs text-zinc-500">
                  ≈ {songs} {t("pack_songs_approx")} · ${perSong.toFixed(2)}/song
                </p>
              </div>

              <ul className="flex flex-col gap-1.5 text-xs text-zinc-400">
                {PACK_FEATURE_KEYS.map((key) => (
                  <li key={key} className="flex items-start gap-1.5">
                    <span className="text-[#F5B900] shrink-0">✓</span>
                    {t(key)}
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
                {loadingId === pack.id ? t("pack_redirecting") : t("pack_buy")}
              </button>
            </div>
          );
        })}
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
