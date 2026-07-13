"use client";

import { useState } from "react";
import Image from "next/image";
import { RadioPlayer } from "@/components/RadioPlayer";
import type { WordTimestamp } from "@/lib/lyrics";

type LibrarySong = {
  id: string;
  title: string;
  stylePrompt: string;
  lyricsText: string;
  wordTimestamps: WordTimestamp[] | null;
  durationSeconds: number;
  createdAt: string;
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function LibraryList({ songs: initialSongs }: { songs: LibrarySong[] }) {
  const [songs, setSongs] = useState(initialSongs);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Remove this song from your library?")) return;
    const res = await fetch(`/api/songs/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSongs((prev) => prev.filter((s) => s.id !== id));
      if (expandedId === id) setExpandedId(null);
    }
  }

  if (expandedId) {
    const song = songs.find((s) => s.id === expandedId);
    if (song) {
      return (
        <div className="flex flex-col gap-4">
          <button
            onClick={() => setExpandedId(null)}
            className="self-start text-sm text-zinc-400 hover:text-zinc-100"
          >
            ← Back to library
          </button>
          <RadioPlayer
            songId={song.id}
            title={song.title}
            stylePrompt={song.stylePrompt}
            lyricsText={song.lyricsText}
            wordTimestamps={song.wordTimestamps}
          />
        </div>
      );
    }
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {songs.map((song) => (
        <div
          key={song.id}
          onClick={() => setExpandedId(song.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setExpandedId(song.id);
          }}
          className="text-left rounded-2xl border border-zinc-800 bg-zinc-950 p-4 flex flex-col gap-3 hover:border-zinc-600 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="shrink-0 rounded-full bg-[#F5B900]/10 p-1.5">
              <Image src="/branding/jake-logo.svg" alt="" width={32} height={32} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{song.title}</p>
              <p className="text-xs text-zinc-500">
                {formatDuration(song.durationSeconds)} · {new Date(song.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <p className="text-xs text-zinc-500 line-clamp-2">{song.stylePrompt}</p>

          <div className="flex items-center justify-between mt-auto pt-2 text-xs">
            <span className="text-zinc-500">View & play →</span>
            <a
              href={`/api/songs/${song.id}/audio?download=1`}
              onClick={(e) => e.stopPropagation()}
              className="text-zinc-500 hover:text-zinc-100"
            >
              Download
            </a>
            <button onClick={(e) => handleDelete(song.id, e)} className="text-zinc-600 hover:text-red-400">
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
