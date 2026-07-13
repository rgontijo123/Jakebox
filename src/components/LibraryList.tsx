"use client";

import { useState } from "react";

type LibrarySong = {
  id: string;
  title: string;
  stylePrompt: string;
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

  async function handleDelete(id: string) {
    if (!confirm("Remove this song from your library?")) return;
    const res = await fetch(`/api/songs/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSongs((prev) => prev.filter((s) => s.id !== id));
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {songs.map((song) => (
        <div key={song.id} className="rounded-md border border-zinc-800 p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{song.title}</p>
              <p className="text-xs text-zinc-500">
                {formatDuration(song.durationSeconds)} · {new Date(song.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0 text-sm">
              <button
                onClick={() => setExpandedId(expandedId === song.id ? null : song.id)}
                className="text-zinc-400 hover:text-zinc-100"
              >
                {expandedId === song.id ? "Hide" : "Play"}
              </button>
              <a
                href={`/api/songs/${song.id}/audio?download=1`}
                className="text-zinc-400 hover:text-zinc-100"
              >
                Download
              </a>
              <button onClick={() => handleDelete(song.id)} className="text-zinc-500 hover:text-red-400">
                Remove
              </button>
            </div>
          </div>

          {expandedId === song.id && (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <audio controls autoPlay src={`/api/songs/${song.id}/audio`} className="w-full" />
          )}
        </div>
      ))}
    </div>
  );
}
