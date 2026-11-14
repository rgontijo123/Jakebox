"use client";

import { useState } from "react";
import { GENRES, type GenreStyle } from "@/lib/genreStyles";
import { useLocale } from "@/lib/i18n/LocaleProvider";

/** Pick a genre, then one of its ready-made styles -- fills the style field
 * (and the lyrics language when the style implies one). */
export function GenrePicker({ currentPrompt, onPick }: { currentPrompt: string; onPick: (style: GenreStyle) => void }) {
  const { t, locale } = useLocale();
  const [genreId, setGenreId] = useState<string | null>(null);
  const genre = GENRES.find((g) => g.id === genreId);

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm">{t("genre_pick")}</span>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {GENRES.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setGenreId(g.id === genreId ? null : g.id)}
            className={`truncate rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              g.id === genreId
                ? "border-[#F5B900] bg-[#F5B900] text-black"
                : "border-zinc-700 text-zinc-300 hover:border-[#F5B900] hover:text-zinc-100"
            }`}
          >
            {g.emoji} {g.name[locale]}
          </button>
        ))}
      </div>

      {genre && (
        <div className="grid sm:grid-cols-2 gap-2">
          {genre.styles.map((s) => {
            const selected = s.prompt === currentPrompt;
            return (
              <button
                key={s.prompt}
                type="button"
                onClick={() => onPick(s)}
                className={`text-left rounded-xl border p-3 transition-colors ${
                  selected
                    ? "border-[#F5B900] bg-[#F5B900]/10"
                    : "border-zinc-800 hover:border-[#F5B900]/60 hover:bg-zinc-900"
                }`}
              >
                <p className="text-sm font-medium text-zinc-100">
                  {selected ? "✓ " : ""}
                  {s.name[locale]}
                </p>
                <p className="text-xs text-zinc-500 line-clamp-2 mt-0.5">{s.prompt}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
