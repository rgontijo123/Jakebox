"use client";

import { useState } from "react";
import { GenerationForm } from "@/components/GenerationForm";
import { WorkspaceList } from "@/components/WorkspaceList";

export function CreateWorkspace() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="w-full max-w-6xl grid lg:grid-cols-[380px_1fr] gap-8 items-start">
      <div className="lg:sticky lg:top-6">
        <GenerationForm onCreated={() => setRefreshKey((k) => k + 1)} />
      </div>
      <div className="min-w-0">
        <h2 className="text-sm font-medium text-zinc-400 mb-3">Your songs</h2>
        <WorkspaceList refreshKey={refreshKey} />
      </div>
    </div>
  );
}
