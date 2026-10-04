"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

export function UploadModal({ onClose, onUploaded }: { onClose: () => void; onUploaded: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("en");
  const [lyricsText, setLyricsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError("Choose an audio file");
      return;
    }
    if (!title.trim()) {
      setError("Give it a title");
      return;
    }

    setLoading(true);
    const form = new FormData();
    form.set("audio", file);
    form.set("title", title.trim());
    form.set("language", language);
    form.set("lyricsText", lyricsText);

    const res = await fetch("/api/songs/upload", { method: "POST", body: form });
    const data = await res.json().catch(() => null);
    setLoading(false);

    if (!res.ok) {
      setError(data?.error ?? "Upload failed");
      return;
    }

    onUploaded();
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-5"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Upload audio</h3>
          <button type="button" onClick={onClose} className="text-zinc-500 hover:text-zinc-100" aria-label="Close">
            ✕
          </button>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          Audio file
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm text-zinc-400 file:mr-3 file:rounded-full file:border-0 file:bg-zinc-800 file:px-3 file:py-1.5 file:text-zinc-100 file:text-sm hover:file:bg-zinc-700"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Song title"
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Language
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-2"
          >
            <option value="en">English</option>
            <option value="pt-BR">Portuguese (Brazil)</option>
            <option value="pt-PT">Portuguese (Portugal)</option>
            <option value="es">Spanish</option>
            <option value="de">German</option>
            <option value="ja">Japanese</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Lyrics (optional)
          <textarea
            value={lyricsText}
            onChange={(e) => setLyricsText(e.target.value)}
            rows={4}
            placeholder="Paste the lyrics if you have them -- powers the synced lyrics player"
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-mono resize-y"
          />
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="self-start rounded-full bg-[#F5B900] text-black px-6 py-2.5 text-sm font-medium hover:bg-[#ffcc33] transition-colors disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      </form>
    </div>,
    document.body,
  );
}
