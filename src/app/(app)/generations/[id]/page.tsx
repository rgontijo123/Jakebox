"use client";

import { useEffect, useState, use } from "react";
import { SongPlayer } from "@/components/SongPlayer";

type GenerationStatus = {
  id: string;
  status: "pending" | "processing" | "completed" | "failed" | "rejected_moderation";
  stylePrompt: string;
  errorMessage: string | null;
  creditsCharged: number;
  creditsRefunded: number;
  song: { id: string; title: string; durationSeconds: number } | null;
};

export default function GenerationStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<GenerationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval>;

    async function poll() {
      const res = await fetch(`/api/generations/${id}`);
      if (!res.ok) {
        if (!cancelled) setError("Could not load this generation");
        return;
      }
      const json: GenerationStatus = await res.json();
      if (cancelled) return;
      setData(json);
      if (json.status === "completed" || json.status === "failed" || json.status === "rejected_moderation") {
        clearInterval(interval);
      }
    }

    poll();
    interval = setInterval(poll, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [id]);

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 gap-6">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">Your song</h1>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {!data && !error && <p className="text-sm text-zinc-400">Loading...</p>}

        {data && (data.status === "pending" || data.status === "processing") && (
          <div className="flex items-center gap-3 text-zinc-400">
            <span className="inline-block h-4 w-4 rounded-full border-2 border-zinc-600 border-t-white animate-spin" />
            Generating your song — usually 1-3 minutes...
          </div>
        )}

        {data?.status === "failed" && (
          <p className="text-sm text-red-400">
            Generation failed: {data.errorMessage ?? "unknown error"}. Your credits have been refunded.
          </p>
        )}

        {data?.status === "rejected_moderation" && (
          <p className="text-sm text-red-400">
            This request was rejected by our content policy. No credits were charged.
          </p>
        )}

        {data?.status === "completed" && data.song && (
          <SongPlayer songId={data.song.id} title={data.song.title} />
        )}
      </div>
    </main>
  );
}
