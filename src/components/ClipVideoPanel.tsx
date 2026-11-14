"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";

type Song = { id: string; title: string; durationSeconds: number };

type Job = {
  id: string;
  songId: string;
  songTitle: string;
  status: "processing" | "done" | "error";
  errorMessage: string | null;
  clipCount: number;
  videoUrl: string | null;
  durationSeconds: number | null;
};

const MIN_CLIPS = 2;
const MAX_CLIPS = 6;

export function ClipVideoPanel({ songs }: { songs: Song[] }) {
  const { t } = useLocale();
  const [selectedSongId, setSelectedSongId] = useState(songs[0]?.id ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function loadJobs() {
    const res = await fetch("/api/clip-video/jobs");
    if (!res.ok) return;
    const data = await res.json();
    setJobs(data.jobs);
  }

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    const hasProcessing = jobs.some((j) => j.status === "processing");
    if (hasProcessing && !pollRef.current) {
      pollRef.current = setInterval(async () => {
        const processing = jobs.filter((j) => j.status === "processing");
        for (const job of processing) {
          const res = await fetch(`/api/clip-video/jobs/${job.id}`);
          if (!res.ok) continue;
          const updated = await res.json();
          setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, ...updated } : j)));
        }
      }, 4000);
    } else if (!hasProcessing && pollRef.current) {
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

  function onFilesPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    setFiles(picked.slice(0, MAX_CLIPS));
  }

  async function submit() {
    if (!selectedSongId || files.length < MIN_CLIPS) return;
    setSubmitting(true);
    setError(null);

    const form = new FormData();
    form.set("songId", selectedSongId);
    for (const file of files) form.append("clips", file);

    const res = await fetch("/api/clip-video/jobs", { method: "POST", body: form });
    const data = await res.json().catch(() => null);
    setSubmitting(false);
    if (!res.ok) {
      setError(data?.error ?? t("clip_failed_start"));
      return;
    }
    setFiles([]);
    loadJobs();
  }

  const canSubmit = selectedSongId && files.length >= MIN_CLIPS && files.length <= MAX_CLIPS;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-zinc-500">
        {t("clip_intro", { min: MIN_CLIPS, max: MAX_CLIPS })}
      </p>

      <label className="flex flex-col gap-1 text-sm">
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

      <label className="flex flex-col gap-1 text-sm">
        {t("clip_clips", { min: MIN_CLIPS, max: MAX_CLIPS })}
        <input
          type="file"
          accept="video/*"
          multiple
          onChange={onFilesPicked}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
        />
        {files.length > 0 && (
          <span className="text-xs text-zinc-500">
            {t("clip_selected", { n: files.length })}
            {files.length < MIN_CLIPS && t("clip_need_more", { min: MIN_CLIPS })}
          </span>
        )}
      </label>

      <button
        onClick={submit}
        disabled={submitting || !canSubmit}
        className="self-start rounded-full bg-[#F5B900] text-black px-5 py-2 text-sm font-medium hover:bg-[#ffcc33] disabled:opacity-50"
      >
        {submitting ? t("clip_starting") : t("clip_generate")}
      </button>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex flex-col divide-y divide-zinc-800 border border-zinc-800 rounded-2xl overflow-hidden">
        {jobs.length === 0 && <p className="p-4 text-sm text-zinc-500">{t("clip_none")}</p>}
        {jobs.map((job) => (
          <div key={job.id} className="flex flex-col gap-2 px-4 py-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium">
                {t("clip_job", { title: job.songTitle, n: job.clipCount })}
              </span>
              <span
                className={
                  job.status === "error"
                    ? "text-red-400"
                    : job.status === "processing"
                      ? "text-zinc-500"
                      : "text-green-400"
                }
              >
                {job.status === "processing" ? t("clip_processing") : job.status === "error" ? t("clip_failed") : t("clip_ready")}
              </span>
            </div>
            {job.status === "error" && job.errorMessage && (
              <p className="text-xs text-red-400">{job.errorMessage}</p>
            )}
            {job.status === "done" && job.videoUrl && (
              <video
                controls
                className="w-full max-w-[240px] rounded-lg"
                src={`/api/clip-video/jobs/${job.id}/video`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
