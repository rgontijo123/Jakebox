"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { translateApiError } from "@/lib/i18n/apiErrors";

type Job = {
  id: string;
  songTitle: string;
  status: "running" | "done" | "error";
  videoUrl: string | null;
  durationSeconds: number | null;
  promoText: string | null;
  shortUrl: string | null;
};

export function StudioPanel() {
  const { t } = useLocale();
  const [jobs, setJobs] = useState<Job[] | null>(null);

  async function load() {
    const res = await fetch("/api/video-studio/jobs");
    if (!res.ok) return;
    const data = await res.json();
    setJobs(data.jobs.filter((j: Job) => j.status === "done"));
  }

  useEffect(() => {
    load();
  }, []);

  if (jobs === null) return <p className="text-sm text-zinc-500">{t("list_loading")}</p>;
  if (jobs.length === 0) {
    return <p className="text-sm text-zinc-500">{t("studio_no_videos")}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {jobs.map((job) => (
        <JobEditor key={job.id} job={job} onChange={load} />
      ))}
    </div>
  );
}

function JobEditor({ job, onChange }: { job: Job; onChange: () => void }) {
  const { t } = useLocale();
  const [start, setStart] = useState("0");
  const [end, setEnd] = useState(String(job.durationSeconds ?? 30));
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function cutShort(mode: "manual" | "auto") {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/video-studio/jobs/${job.id}/short`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, start: Number(start), end: Number(end) }),
    });
    const data = await res.json().catch(() => null);
    setBusy(false);
    if (!res.ok) {
      setError(translateApiError(data?.error, t, "studio_cut_failed"));
      return;
    }
    onChange();
  }

  async function saveLinks() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/video-studio/jobs/${job.id}/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spotifyUrl, youtubeUrl }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(translateApiError(data?.error, t, "studio_links_failed"));
    }
  }

  async function copyPromo() {
    if (!job.promoText) return;
    await navigator.clipboard.writeText(job.promoText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-4 border border-zinc-800 rounded-2xl p-4">
      <div className="flex items-start gap-4">
        {job.videoUrl && (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video controls src={job.videoUrl} className="w-32 rounded-lg shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{job.songTitle}</p>
          {job.promoText && (
            <div className="mt-2 flex flex-col gap-1">
              <p className="text-xs text-zinc-500 whitespace-pre-wrap line-clamp-4">{job.promoText}</p>
              <button onClick={copyPromo} className="text-xs underline text-zinc-400 hover:text-zinc-100 w-fit">
                {copied ? t("studio_copied") : t("studio_copy_promo")}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-zinc-800 pt-4">
        <span className="text-xs text-zinc-500">{t("studio_short_clip")}</span>
        {job.shortUrl ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video controls src={job.shortUrl} className="w-24 rounded-lg" />
        ) : (
          <span className="text-xs text-zinc-600">{t("studio_not_cut")}</span>
        )}
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="w-20 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm"
            aria-label={t("studio_start_seconds")}
          />
          <span className="text-xs text-zinc-500">{t("studio_to")}</span>
          <input
            type="number"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="w-20 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm"
            aria-label={t("studio_end_seconds")}
          />
          <button
            onClick={() => cutShort("manual")}
            disabled={busy}
            className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300 hover:text-zinc-100 disabled:opacity-50"
          >
            {t("studio_cut")}
          </button>
          <button
            onClick={() => cutShort("auto")}
            disabled={busy}
            className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300 hover:text-zinc-100 disabled:opacity-50"
          >
            {t("studio_auto_chorus")}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-zinc-800 pt-4">
        <span className="text-xs text-zinc-500">{t("studio_channel_links")}</span>
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={spotifyUrl}
            onChange={(e) => setSpotifyUrl(e.target.value)}
            placeholder={t("studio_spotify_link")}
            className="flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm"
          />
          <input
            type="url"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder={t("studio_youtube_link")}
            className="flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm"
          />
          <button
            onClick={saveLinks}
            disabled={busy}
            className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300 hover:text-zinc-100 disabled:opacity-50"
          >
            {t("admin_save")}
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
