"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { translateApiError } from "@/lib/i18n/apiErrors";

type Song = { id: string; title: string; durationSeconds: number };

type Job = {
  id: string;
  songId: string;
  songTitle: string;
  name: string;
  status: "running" | "done" | "error";
  stage?: string | null;
  errorMessage: string | null;
  videoUrl: string | null;
  durationSeconds: number | null;
  promoText: string | null;
  shortUrl: string | null;
  unavailable?: string;
};

export function VideoStudioPanel({ songs }: { songs: Song[] }) {
  const { t } = useLocale();
  const [selectedSongId, setSelectedSongId] = useState(songs[0]?.id ?? "");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function loadJobs() {
    const res = await fetch("/api/video-studio/jobs");
    if (!res.ok) return;
    const data = await res.json();
    setJobs(data.jobs);
  }

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    const hasRunning = jobs.some((j) => j.status === "running");
    if (hasRunning && !pollRef.current) {
      pollRef.current = setInterval(async () => {
        const running = jobs.filter((j) => j.status === "running");
        for (const job of running) {
          const res = await fetch(`/api/video-studio/jobs/${job.id}`);
          if (!res.ok) continue;
          const updated = await res.json();
          setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, ...updated } : j)));
        }
      }, 4000);
    } else if (!hasRunning && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [jobs]);

  async function submit() {
    if (!selectedSongId) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/video-studio/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ songId: selectedSongId }),
    });
    const data = await res.json().catch(() => null);
    setSubmitting(false);
    if (!res.ok) {
      setError(translateApiError(data?.error, t, "clip_failed_start"));
      return;
    }
    loadJobs();
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <label className="flex flex-col gap-1 text-sm flex-1">
          {t("clip_song")}
          <select
            value={selectedSongId}
            onChange={(e) => setSelectedSongId(e.target.value)}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2"
          >
            {songs.length === 0 && <option value="">{t("clip_no_songs")}</option>}
            {songs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={submit}
          disabled={submitting || !selectedSongId}
          className="rounded-full bg-[#F5B900] text-black px-5 py-2 text-sm font-medium hover:bg-[#ffcc33] disabled:opacity-50"
        >
          {submitting ? t("clip_starting") : t("clip_generate")}
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex flex-col divide-y divide-zinc-800 border border-zinc-800 rounded-2xl overflow-hidden">
        {jobs.length === 0 && <p className="p-4 text-sm text-zinc-500">{t("vstudio_no_renders")}</p>}
        {jobs.map((job) => (
          <div key={job.id} className="flex flex-col gap-2 px-4 py-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium truncate">{job.songTitle}</span>
              {job.status === "running" && (
                <span className="flex items-center gap-1.5 text-zinc-500 text-xs shrink-0">
                  <span className="inline-block h-3 w-3 rounded-full border-2 border-zinc-700 border-t-[#F5B900] animate-spin" />
                  {job.stage || t("vstudio_working")}
                </span>
              )}
              {job.status === "done" && <span className="text-xs text-emerald-400 shrink-0">{t("clip_ready")}</span>}
              {job.status === "error" && <span className="text-xs text-red-400 shrink-0">{t("clip_failed")}</span>}
            </div>

            {job.unavailable && <p className="text-xs text-amber-400">{job.unavailable}</p>}
            {job.status === "error" && job.errorMessage && (
              <p className="text-xs text-red-400">{job.errorMessage}</p>
            )}

            {job.status === "done" && job.videoUrl && (
              <div className="flex flex-col gap-2">
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video controls src={job.videoUrl} className="w-full max-w-xs rounded-lg" />
                <a href="/studio" className="text-xs underline text-zinc-400 hover:text-zinc-100 w-fit">
                  {t("vstudio_edit_in_studio")}
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
