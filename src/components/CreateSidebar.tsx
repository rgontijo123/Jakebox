"use client";

import { useEffect, useState } from "react";
import { UploadModal } from "@/components/UploadModal";

type StylePreset = { id: string; name: string; prompt: string };

const STYLE_STORAGE_KEY = "jakebox:draft:stylePrompt";

function scrollToField(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.focus();
}

export function CreateSidebar({
  searchQuery,
  onSearchChange,
  onApplyStylePreset,
  onUploaded,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onApplyStylePreset: (prompt: string) => void;
  onUploaded: () => void;
}) {
  const [presets, setPresets] = useState<StylePreset[] | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  async function loadPresets() {
    const res = await fetch("/api/style-presets");
    if (!res.ok) return;
    const data = await res.json();
    setPresets(data.presets);
  }

  useEffect(() => {
    // Fetches from the server on mount, can't be computed during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPresets();
  }, []);

  async function handleSaveCurrentStyle() {
    const currentStyle = localStorage.getItem(STYLE_STORAGE_KEY)?.trim();
    if (!currentStyle) {
      alert("Write a style prompt in the form first");
      return;
    }
    const name = prompt("Name this style preset:");
    if (!name?.trim()) return;

    const res = await fetch("/api/style-presets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, prompt: currentStyle }),
    });
    if (res.ok) loadPresets();
  }

  async function handleDeletePreset(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const res = await fetch(`/api/style-presets/${id}`, { method: "DELETE" });
    if (res.ok) loadPresets();
  }

  return (
    <>
      <nav className="flex flex-col gap-6 text-sm">
        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-xs font-medium text-sky-400 uppercase tracking-wide">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
            Find
          </span>
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search your songs..."
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm focus:border-sky-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-xs font-medium text-pink-400 uppercase tracking-wide">
            <span className="h-1.5 w-1.5 rounded-full bg-pink-400" />
            Write
          </span>
          <button
            type="button"
            onClick={() => scrollToField("lyrics-textarea")}
            className="text-left text-zinc-300 hover:text-pink-300"
          >
            <span className="text-pink-400">✎</span> Lyrics
          </button>
          <button
            type="button"
            onClick={() => scrollToField("style-textarea")}
            className="text-left text-zinc-300 hover:text-amber-300"
          >
            <span className="text-amber-400">🎨</span> Style
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-medium text-violet-400 uppercase tracking-wide">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
              Saved styles
            </span>
            <button
              type="button"
              onClick={handleSaveCurrentStyle}
              title="Save current style as a preset"
              aria-label="Save current style as a preset"
              className="text-violet-400 hover:text-violet-200"
            >
              +
            </button>
          </div>
          {presets === null ? (
            <p className="text-xs text-zinc-600">Loading...</p>
          ) : presets.length === 0 ? (
            <p className="text-xs text-zinc-600">No saved styles yet.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {presets.map((p) => (
                <li key={p.id} className="group flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onApplyStylePreset(p.prompt)}
                    title={p.prompt}
                    className="flex-1 min-w-0 truncate text-left text-zinc-300 hover:text-violet-300"
                  >
                    {p.name}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeletePreset(p.id, e)}
                    aria-label={`Delete ${p.name}`}
                    className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 uppercase tracking-wide">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Library
          </span>
          <button
            type="button"
            onClick={() => scrollToField("songs-list")}
            className="text-left text-zinc-300 hover:text-emerald-300"
          >
            <span className="text-emerald-400">⬇</span> Download songs
          </button>
          <button
            type="button"
            onClick={() => setShowUpload(true)}
            className="text-left text-zinc-300 hover:text-cyan-300"
          >
            <span className="text-cyan-400">⬆</span> Upload audio
          </button>
        </div>
      </nav>

      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onUploaded={onUploaded} />
      )}
    </>
  );
}
