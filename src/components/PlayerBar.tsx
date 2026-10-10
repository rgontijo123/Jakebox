"use client";

import { usePlayer } from "@/contexts/PlayerContext";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PlayerBar() {
  const { current, isPlaying, currentTime, duration, toggle, seek } = usePlayer();

  if (!current) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-800 bg-black/95 backdrop-blur px-4 py-3 flex items-center gap-4">
      <div className="min-w-0 w-56">
        <p className="text-sm font-medium truncate">{current.title}</p>
        <p className="text-xs text-zinc-500 truncate">{current.stylePrompt}</p>
      </div>

      <button
        onClick={toggle}
        className="shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-[#F5B900] text-black hover:bg-[#ffcc33] transition-colors"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <rect x="3" y="2" width="4" height="12" />
            <rect x="9" y="2" width="4" height="12" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 2 L14 8 L4 14 Z" />
          </svg>
        )}
      </button>

      <span className="text-xs text-zinc-500 w-9 text-right">{formatTime(currentTime)}</span>
      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={currentTime}
        onChange={(e) => seek(Number(e.target.value))}
        className="flex-1 accent-[#F5B900]"
      />
      <span className="text-xs text-zinc-500 w-9">{formatTime(duration)}</span>

      <a
        href={`/api/songs/${current.songId}/audio?download=1`}
        className="shrink-0 text-xs text-zinc-500 hover:text-zinc-100 underline"
      >
        Download
      </a>

      {current.hasVideo && (
        <a
          href={`/api/songs/${current.songId}/video?download=1`}
          className="shrink-0 text-xs text-zinc-500 hover:text-zinc-100 underline"
        >
          Vídeo
        </a>
      )}
    </div>
  );
}
