"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { RadioPlayer } from "@/components/RadioPlayer";
import { usePlayer } from "@/contexts/PlayerContext";
import type { WordTimestamp } from "@/lib/lyrics";

type GenerationRow = {
  id: string;
  batchId: string;
  status: "pending" | "processing" | "completed" | "failed" | "rejected_moderation";
  stylePrompt: string;
  lyricsText: string;
  errorMessage: string | null;
  createdAt: string;
  song: { id: string; title: string; durationSeconds: number; wordTimestamps: WordTimestamp[] | null } | null;
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Queued...",
  processing: "Generating...",
  failed: "Failed",
  rejected_moderation: "Rejected",
};

export function WorkspaceList({ refreshKey }: { refreshKey?: number }) {
  const [rows, setRows] = useState<GenerationRow[] | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const player = usePlayer();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function load() {
    const res = await fetch("/api/generations");
    if (!res.ok) return;
    const data = await res.json();
    setRows(data.generations);
  }

  useEffect(() => {
    load();
  }, [refreshKey]);

  useEffect(() => {
    const hasInFlight = rows?.some((r) => r.status === "pending" || r.status === "processing");
    if (hasInFlight && !pollRef.current) {
      pollRef.current = setInterval(load, 3000);
    } else if (!hasInFlight && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [rows]);

  async function handleDelete(songId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Remove this song from your library?")) return;
    const res = await fetch(`/api/songs/${songId}`, { method: "DELETE" });
    if (res.ok) load();
  }

  if (!rows) {
    return <p className="text-sm text-zinc-500">Loading...</p>;
  }

  if (rows.length === 0) {
    return <p className="text-sm text-zinc-500">No songs yet — create your first one.</p>;
  }

  return (
    <div className="flex flex-col divide-y divide-zinc-800 border border-zinc-800 rounded-2xl overflow-hidden">
      {rows.map((row) => {
        const isExpanded = expandedId === row.id;
        const isWorking = row.status === "pending" || row.status === "processing";
        const isPlayingThis = row.song && player.current?.songId === row.song.id && player.isPlaying;

        return (
          <div key={row.id}>
            <div
              onClick={() => row.status === "completed" && setExpandedId(isExpanded ? null : row.id)}
              role={row.status === "completed" ? "button" : undefined}
              tabIndex={row.status === "completed" ? 0 : undefined}
              className={`flex items-center gap-3 px-4 py-3 ${
                row.status === "completed" ? "cursor-pointer hover:bg-zinc-900" : ""
              }`}
            >
              <div className="shrink-0 rounded-full bg-[#F5B900]/10 p-1.5">
                <Image src="/branding/jake-logo.svg" alt="" width={32} height={32} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">
                  {row.song?.title ?? (isWorking ? "Generating…" : row.stylePrompt.slice(0, 40))}
                </p>
                <p className="text-xs text-zinc-500 truncate">{row.stylePrompt}</p>
              </div>

              <div className="shrink-0 flex items-center gap-3 text-xs">
                {isWorking && (
                  <span className="flex items-center gap-1.5 text-zinc-500">
                    <span className="inline-block h-3 w-3 rounded-full border-2 border-zinc-700 border-t-[#F5B900] animate-spin" />
                    {STATUS_LABEL[row.status]}
                  </span>
                )}
                {(row.status === "failed" || row.status === "rejected_moderation") && (
                  <span className="text-red-400">{STATUS_LABEL[row.status]}</span>
                )}
                {row.song && (
                  <>
                    <span className="text-zinc-500">{formatDuration(row.song.durationSeconds)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        player.play({
                          songId: row.song!.id,
                          title: row.song!.title,
                          stylePrompt: row.stylePrompt,
                          lyricsText: row.lyricsText,
                          wordTimestamps: row.song!.wordTimestamps,
                        });
                      }}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                        isPlayingThis ? "bg-[#F5B900] text-black" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                      }`}
                      aria-label="Play"
                    >
                      {isPlayingThis ? (
                        <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                          <rect x="3" y="2" width="4" height="12" />
                          <rect x="9" y="2" width="4" height="12" />
                        </svg>
                      ) : (
                        <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M4 2 L14 8 L4 14 Z" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={(e) => handleDelete(row.song!.id, e)}
                      className="text-zinc-600 hover:text-red-400"
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>

            {isExpanded && row.song && (
              <div className="px-4 pb-4">
                <RadioPlayer
                  songId={row.song.id}
                  title={row.song.title}
                  stylePrompt={row.stylePrompt}
                  lyricsText={row.lyricsText}
                  wordTimestamps={row.song.wordTimestamps}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
