"use client";

import { alignLyrics, activeWordIndex, type WordTimestamp } from "@/lib/lyrics";
import { usePlayer } from "@/contexts/PlayerContext";

export function RadioPlayer({
  songId,
  title,
  stylePrompt,
  lyricsText,
  wordTimestamps,
}: {
  songId: string;
  title: string;
  stylePrompt: string;
  lyricsText: string;
  wordTimestamps: WordTimestamp[] | null;
}) {
  const player = usePlayer();
  const isActive = player.current?.songId === songId;
  const currentMs = isActive ? player.currentTime * 1000 : -1;

  const lines = alignLyrics(lyricsText, wordTimestamps ?? []);

  function handlePlay() {
    player.play({ songId, title, stylePrompt, lyricsText, wordTimestamps });
  }

  return (
    <div className="w-full rounded-2xl border border-zinc-800 bg-black/40 p-4 flex flex-col gap-4">
      <button
        onClick={handlePlay}
        className="self-start flex items-center gap-2 rounded-full bg-[#F5B900] text-black pl-3 pr-4 py-1.5 text-sm font-medium hover:bg-[#ffcc33] transition-colors"
      >
        {isActive && player.isPlaying ? (
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <rect x="3" y="2" width="4" height="12" />
            <rect x="9" y="2" width="4" height="12" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 2 L14 8 L4 14 Z" />
          </svg>
        )}
        {isActive && player.isPlaying ? "Playing" : "Play"}
      </button>

      {lines.length > 0 && (
        <div className="max-h-72 overflow-y-auto rounded-lg bg-black/40 p-4 flex flex-col gap-2.5 text-sm leading-relaxed">
          {lines.map((line, i) =>
            line.isTag ? (
              <p key={i} className="text-xs uppercase tracking-wide text-zinc-600 mt-2 first:mt-0">
                {line.text}
              </p>
            ) : (
              <p key={i}>
                {line.words.map((w, j) => {
                  const active = currentMs >= 0 && activeWordIndex(line.words, currentMs) === j;
                  const sung = currentMs >= 0 && w.startMs !== null && w.startMs <= currentMs;
                  return (
                    <span
                      key={j}
                      className={
                        active
                          ? "text-[#F5B900] font-medium"
                          : sung
                            ? "text-zinc-300"
                            : "text-zinc-500"
                      }
                    >
                      {w.text}{" "}
                    </span>
                  );
                })}
              </p>
            ),
          )}
        </div>
      )}
    </div>
  );
}
