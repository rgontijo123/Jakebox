"use client";

import { useEffect, useState } from "react";
import { CreateSidebar } from "@/components/CreateSidebar";
import { GenerationForm, type RemixSeed, type StyleSeed } from "@/components/GenerationForm";
import { WorkspaceList } from "@/components/WorkspaceList";

export function CreateWorkspace() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [remixSeed, setRemixSeed] = useState<RemixSeed | null>(null);
  const [styleSeed, setStyleSeed] = useState<StyleSeed | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Debounce so typing a search term doesn't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  return (
    <div className="w-full max-w-7xl grid lg:grid-cols-[200px_580px_1fr] gap-8 items-start">
      <div className="lg:sticky lg:top-6">
        <CreateSidebar
          searchQuery={searchInput}
          onSearchChange={setSearchInput}
          onApplyStylePreset={(pv) => setStyleSeed({ value: pv, nonce: Date.now() })}
          onUploaded={() => setRefreshKey((k) => k + 1)}
        />
      </div>
      <div className="lg:sticky lg:top-6">
        <GenerationForm
          onCreated={() => setRefreshKey((k) => k + 1)}
          remixSeed={remixSeed}
          styleSeed={styleSeed}
        />
      </div>
      <div className="min-w-0" id="songs-list">
        <h2 className="text-sm font-medium text-zinc-400 mb-3">Your songs</h2>
        <WorkspaceList
          refreshKey={refreshKey}
          searchQuery={searchQuery}
          onRemix={(stylePrompt, lyricsText) => setRemixSeed({ stylePrompt, lyricsText, nonce: Date.now() })}
        />
      </div>
    </div>
  );
}
