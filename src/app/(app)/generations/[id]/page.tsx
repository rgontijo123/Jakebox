"use client";

import { useEffect, useState, use } from "react";
import { RadioPlayer } from "@/components/RadioPlayer";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { translateFailureReason } from "@/lib/i18n/apiErrors";
import type { WordTimestamp } from "@/lib/lyrics";

type GenerationEntry = {
  id: string;
  status: "pending" | "processing" | "completed" | "failed" | "rejected_moderation";
  errorMessage: string | null;
  song: {
    id: string;
    title: string;
    durationSeconds: number;
    wordTimestamps: WordTimestamp[] | null;
    hasVideo: boolean;
  } | null;
};

type BatchResponse = {
  batchId: string;
  stylePrompt: string;
  lyricsText: string;
  generations: GenerationEntry[];
};

export default function BatchResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: batchId } = use(params);
  const { t } = useLocale();
  const [data, setData] = useState<BatchResponse | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval>;

    async function poll() {
      const res = await fetch(`/api/generations/batch/${batchId}`);
      if (!res.ok) {
        if (!cancelled) setLoadFailed(true);
        return;
      }
      const json: BatchResponse = await res.json();
      if (cancelled) return;
      setData(json);
      const stillWorking = json.generations.some((g) => g.status === "pending" || g.status === "processing");
      if (!stillWorking) clearInterval(interval);
    }

    poll();
    interval = setInterval(poll, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [batchId]);

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 gap-6">
      <div className={`w-full ${data && data.generations.length > 1 ? "max-w-4xl" : "max-w-2xl"} flex flex-col gap-6`}>
        <h1 className="text-2xl font-semibold">
          {data && data.generations.length > 1 ? t("result_versions") : t("result_song")}
        </h1>

        {loadFailed && <p className="text-sm text-red-400">{t("result_load_error")}</p>}
        {!data && !loadFailed && <p className="text-sm text-zinc-400">{t("list_loading")}</p>}

        <div className={data && data.generations.length > 1 ? "grid sm:grid-cols-2 gap-6" : ""}>
          {data?.generations.map((g) => (
            <div key={g.id}>
              {(g.status === "pending" || g.status === "processing") && (
                <div className="flex items-center gap-3 text-zinc-400 rounded-2xl border border-zinc-800 p-6">
                  <span className="inline-block h-4 w-4 rounded-full border-2 border-zinc-600 border-t-[#F5B900] animate-spin" />
                  {t("result_generating")}
                </div>
              )}

              {g.status === "failed" && (
                <p className="text-sm text-red-400 rounded-2xl border border-zinc-800 p-6">
                  {t("result_failed", { reason: translateFailureReason(g.errorMessage, t) })}
                </p>
              )}

              {g.status === "rejected_moderation" && (
                <p className="text-sm text-red-400 rounded-2xl border border-zinc-800 p-6">
                  {t("result_rejected")}
                </p>
              )}

              {g.status === "completed" && g.song && data && (
                <RadioPlayer
                  songId={g.song.id}
                  title={g.song.title}
                  stylePrompt={data.stylePrompt}
                  lyricsText={data.lyricsText}
                  wordTimestamps={g.song.wordTimestamps}
                  hasVideo={g.song.hasVideo}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
