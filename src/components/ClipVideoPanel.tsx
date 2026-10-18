"use client";

import { useEffect, useRef, useState } from "react";

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
      setError(data?.error ?? "Failed to start video render");
      return;
    }
    setFiles([]);
    loadJobs();
  }

  const canSubmit = selectedSongId && files.length >= MIN_CLIPS && files.length <= MAX_CLIPS;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-zinc-500">
        Upload {MIN_CLIPS}-{MAX_CLIPS} of your own clips (DJ footage, you singing, anything) -- they&apos;re
        stitched together with crossfades and topped with one of your songs.
      </p>

      <label className="flex flex-col gap-1 text-sm">
        Song
        <select
          value={selectedSongId}
          onChange={(e) => setSelectedSongId(e.target.value)}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2"
        >
          {songs.length === 0 && <option value="">No songs yet</option>}
          {songs.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Clips ({MIN_CLIPS}-{MAX_CLIPS} videos)
        <input
          type="file"
          accept="video/*"
          multiple
          onChange={onFilesPicked}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
        />
        {files.length > 0 && (
          <span className="text-xs text-zinc-500">
            {files.length} clip{files.length === 1 ? "" : "s"} selected
            {files.length < MIN_CLIPS && ` -- need at least ${MIN_CLIPS}`}
          </span>
        )}
      </label>

      <button
        onClick={submit}
        disabled={submitting || !canSubmit}
        className="self-start rounded-full bg-[#F5B900] text-black px-5 py-2 text-sm font-medium hover:bg-[#ffcc33] disabled:opacity-50"
      >
        {submitting ? "Starting..." : "Generate video"}
      </button>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex flex-col divide-y divide-zinc-800 border border-zinc-800 rounded-2xl overflow-hidden">
        {jobs.length === 0 && <p className="p-4 text-sm text-zinc-500">No clip videos yet.</p>}
        {jobs.map((job) => (
          <div key={job.id} className="flex flex-col gap-2 px-4 py-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium">
                {job.songTitle} ({job.clipCount} clips)
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
                {job.status === "processing" ? "Processing…" : job.status === "error" ? "Failed" : "Ready"}
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
