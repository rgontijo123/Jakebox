"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { RadioPlayer } from "@/components/RadioPlayer";
import { usePlayer } from "@/contexts/PlayerContext";
import type { WordTimestamp } from "@/lib/lyrics";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { DictionaryKey } from "@/lib/i18n/translations";

type GenerationRow = {
  id: string;
  batchId: string;
  status: "pending" | "processing" | "completed" | "failed" | "rejected_moderation";
  stylePrompt: string;
  lyricsText: string;
  language: string;
  errorMessage: string | null;
  createdAt: string;
  song: {
    id: string;
    title: string;
    durationSeconds: number;
    wordTimestamps: WordTimestamp[] | null;
    hasVideo: boolean;
    hasThumbnail: boolean;
  } | null;
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const datePart = d.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit" });
  const timePart = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return `${datePart} ${timePart}`;
}

const LANGUAGE_LABEL: Record<string, DictionaryKey> = {
  en: "lang_en",
  "pt-BR": "lang_pt_br",
  "pt-PT": "lang_pt_pt",
  es: "lang_es",
  de: "lang_de",
  ja: "lang_ja",
};

const STATUS_LABEL: Record<string, DictionaryKey> = {
  pending: "status_pending",
  processing: "status_processing",
  failed: "status_failed",
  rejected_moderation: "status_rejected",
};

const PAGE_SIZE = 10;

export function WorkspaceList({
  refreshKey,
  searchQuery,
  onRemix,
}: {
  refreshKey?: number;
  searchQuery?: string;
  onRemix?: (stylePrompt: string, lyricsText: string) => void;
}) {
  const { t } = useLocale();
  const [rows, setRows] = useState<GenerationRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [generatingVideoId, setGeneratingVideoId] = useState<string | null>(null);
  const [regeneratingCoverId, setRegeneratingCoverId] = useState<string | null>(null);
  // Cache-busts the thumbnail <img> after a manual regenerate -- the URL is
  // otherwise identical, so the browser would keep showing the old cached
  // image even after the server-side file changes.
  const [coverBust, setCoverBust] = useState<Record<string, number>>({});
  const player = usePlayer();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function load() {
    const params = new URLSearchParams({ page: String(page) });
    if (searchQuery) params.set("search", searchQuery);
    const res = await fetch(`/api/generations?${params}`);
    if (!res.ok) return;
    const data = await res.json();
    setRows(data.generations);
    setTotal(data.total ?? data.generations.length);
  }

  // A new search resets to page 1; otherwise keep the current page.
  useEffect(() => {
    // Resetting pagination in response to a new search term.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [searchQuery]);

  useEffect(() => {
    // Fetches from the server, can't be computed during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, searchQuery, page]);

  useEffect(() => {
    const hasInFlight = rows?.some((r) => r.status === "pending" || r.status === "processing");
    if (hasInFlight && !pollRef.current) {
      pollRef.current = setInterval(load, 3000);
    } else if (!hasInFlight && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [rows]);

  async function handleDelete(songId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(t("list_confirm_delete"))) return;
    const res = await fetch(`/api/songs/${songId}`, { method: "DELETE" });
    if (res.ok) load();
  }

  async function handleRegenerateCover(songId: string, e: React.MouseEvent) {
    e.stopPropagation();
    setRegeneratingCoverId(songId);
    try {
      const res = await fetch(`/api/songs/${songId}/cover`, { method: "POST" });
      if (res.ok) {
        setCoverBust((b) => ({ ...b, [songId]: Date.now() }));
        await load();
      }
    } finally {
      setRegeneratingCoverId(null);
    }
  }

  async function handleMakeVideo(songId: string, e: React.MouseEvent) {
    e.stopPropagation();
    setGeneratingVideoId(songId);
    try {
      const res = await fetch(`/api/songs/${songId}/video`, { method: "POST" });
      if (res.ok) await load();
    } finally {
      setGeneratingVideoId(null);
    }
  }

  if (!rows) {
    return <p className="text-sm text-zinc-500">{t("list_loading")}</p>;
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        {searchQuery ? t("list_no_match") : t("list_empty")}
      </p>
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-3">
    <div className="flex flex-col divide-y divide-zinc-800 border border-zinc-800 rounded-2xl overflow-hidden">
      {rows.map((row) => {
        const isExpanded = expandedId === row.id;
        const isWorking = row.status === "pending" || row.status === "processing";
        const isPlayingThis = row.song && player.current?.songId === row.song.id && player.isPlaying;

        return (
          <div key={row.id}>
            <div
              onClick={() => row.status === "completed" && setExpandedId(isExpanded ? null : row.id)}
              role={row.status === "completed" ? "button" : undefined}
              tabIndex={row.status === "completed" ? 0 : undefined}
              className={`flex flex-col gap-4 px-4 py-5 sm:px-6 sm:py-6 ${
                row.status === "completed" ? "cursor-pointer hover:bg-zinc-900" : ""
              }`}
            >
              <div className="flex items-stretch gap-4 sm:gap-5">
                {row.song?.hasThumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element -- served
                  // through an authenticated API route, not a static/optimizable asset
                  // Sized to roughly span the title/meta row plus the button
                  // row next to it, large enough for an AI-generated cover
                  // (see src/lib/coverArt.ts) to actually read as cover art
                  // rather than a thumbnail -- a fixed size rather than a
                  // percentage-height trick, since a flex item's height:100%
                  // doesn't reliably resolve against an auto-height row.
                  <img
                    src={`/api/songs/${row.song.id}/thumbnail${
                      coverBust[row.song.id] ? `?v=${coverBust[row.song.id]}` : ""
                    }`}
                    alt=""
                    className="shrink-0 w-[110px] h-[110px] sm:w-[140px] sm:h-[140px] rounded-xl object-cover"
                  />
                ) : (
                  <div className="shrink-0 w-[110px] h-[110px] sm:w-[140px] sm:h-[140px] rounded-xl bg-[#F5B900]/10 flex items-center justify-center">
                    <Image src="/branding/jake-logo.svg" alt="" width={44} height={44} />
                  </div>
                )}

                <div className="min-w-0 flex-1 flex flex-col gap-3">
                  <div className="min-w-0">
                    <p className="text-base font-semibold line-clamp-2">
                      {row.song?.title ?? (isWorking ? t("list_generating") : row.stylePrompt.slice(0, 40))}
                    </p>
                    <p className="text-sm text-zinc-400 line-clamp-3 mt-1">
                      <span className="text-zinc-300">{LANGUAGE_LABEL[row.language] ? t(LANGUAGE_LABEL[row.language]) : row.language}</span>
                      {" · "}
                      {row.stylePrompt}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs mt-2">
                      {isWorking && (
                        <span className="flex items-center gap-1.5 text-zinc-500">
                          <span className="inline-block h-3 w-3 rounded-full border-2 border-zinc-700 border-t-[#F5B900] animate-spin" />
                          {t(STATUS_LABEL[row.status])}
                        </span>
                      )}
                      {(row.status === "failed" || row.status === "rejected_moderation") && (
                        <span className="text-red-400">
                          {t(STATUS_LABEL[row.status])}
                          {row.errorMessage ? `: ${row.errorMessage}` : ""}
                        </span>
                      )}
                      <span className="text-zinc-600">{formatDate(row.createdAt)}</span>
                      {row.song && <span className="text-zinc-500">{formatDuration(row.song.durationSeconds)}</span>}
                    </div>
                  </div>

                </div>
              </div>
                  {row.song && (
                    <div className="flex flex-wrap items-center justify-between gap-y-2 px-1 text-xs">
                      <button
                      onClick={(e) => {
                        e.stopPropagation();
                        player.play({
                          songId: row.song!.id,
                          title: row.song!.title,
                          stylePrompt: row.stylePrompt,
                          lyricsText: row.lyricsText,
                          wordTimestamps: row.song!.wordTimestamps,
                          hasVideo: row.song!.hasVideo,
                        });
                      }}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                        isPlayingThis ? "bg-[#F5B900] text-black" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                      }`}
                      aria-label={t("list_play")}
                    >
                      {isPlayingThis ? (
                        <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                          <rect x="3" y="2" width="4" height="12" />
                          <rect x="9" y="2" width="4" height="12" />
                        </svg>
                      ) : (
                        <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M4 2 L14 8 L4 14 Z" />
                        </svg>
                      )}
                    </button>
                    <a
                      href={`/api/songs/${row.song.id}/audio?download=1`}
                      onClick={(e) => e.stopPropagation()}
                      title={t("list_download")}
                      aria-label={t("list_download")}
                      className="w-7 h-7 flex items-center justify-center rounded-full text-emerald-400/80 hover:text-emerald-300 hover:bg-zinc-800 text-base leading-none"
                    >
                      ⬇
                    </a>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemix?.(row.stylePrompt, row.lyricsText);
                      }}
                      title={t("list_remix")}
                      aria-label={t("list_remix")}
                      className="w-7 h-7 flex items-center justify-center rounded-full text-sky-400/80 hover:text-sky-300 hover:bg-zinc-800 text-base leading-none"
                    >
                      ⟳
                    </button>
                    <button
                      onClick={(e) => handleRegenerateCover(row.song!.id, e)}
                      disabled={regeneratingCoverId === row.song.id}
                      title={regeneratingCoverId === row.song.id ? t("list_regen_cover_busy") : t("list_regen_cover")}
                      aria-label={regeneratingCoverId === row.song.id ? t("list_regen_cover_busy") : t("list_regen_cover")}
                      className="w-7 h-7 flex items-center justify-center rounded-full text-pink-400/80 hover:text-pink-300 hover:bg-zinc-800 text-base leading-none disabled:opacity-50"
                    >
                      {regeneratingCoverId === row.song.id ? (
                        <span className="inline-block h-3 w-3 rounded-full border-2 border-zinc-700 border-t-[#F5B900] animate-spin" />
                      ) : (
                        "🎨"
                      )}
                    </button>
                    <a
                      href={`/api/songs/${row.song.id}/copyright`}
                      onClick={(e) => e.stopPropagation()}
                      title={t("list_copyright")}
                      aria-label={t("list_copyright")}
                      className="w-7 h-7 flex items-center justify-center rounded-full text-violet-400/80 hover:text-violet-300 hover:bg-zinc-800 text-base leading-none"
                    >
                      ©
                    </a>
                    {row.song.hasVideo ? (
                      <a
                        href={`/api/songs/${row.song.id}/video?download=1`}
                        onClick={(e) => e.stopPropagation()}
                        title={t("list_download_video")}
                        aria-label={t("list_download_video")}
                        className="w-7 h-7 flex items-center justify-center rounded-full text-amber-400/80 hover:text-amber-300 hover:bg-zinc-800 text-base leading-none"
                      >
                        🎬
                      </a>
                    ) : (
                      <button
                        onClick={(e) => handleMakeVideo(row.song!.id, e)}
                        disabled={generatingVideoId === row.song.id}
                        title={generatingVideoId === row.song.id ? t("list_make_video_busy") : t("list_make_video")}
                        aria-label={generatingVideoId === row.song.id ? t("list_make_video_busy") : t("list_make_video")}
                        className="w-7 h-7 flex items-center justify-center rounded-full text-amber-400/80 hover:text-amber-300 hover:bg-zinc-800 text-base leading-none disabled:opacity-50"
                      >
                        {generatingVideoId === row.song.id ? (
                          <span className="inline-block h-3 w-3 rounded-full border-2 border-zinc-700 border-t-[#F5B900] animate-spin" />
                        ) : (
                          "🎬"
                        )}
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(row.song!.id, e)}
                      title={t("list_remove")}
                      aria-label={t("list_remove")}
                      className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-600 hover:text-red-400 hover:bg-zinc-800 text-base leading-none"
                    >
                      🗑️
                    </button>
                    </div>
                  )}
            </div>

            {isExpanded && row.song && (
              <div className="px-4 pb-4">
                <RadioPlayer
                  songId={row.song.id}
                  title={row.song.title}
                  stylePrompt={row.stylePrompt}
                  lyricsText={row.lyricsText}
                  wordTimestamps={row.song.wordTimestamps}
                  hasVideo={row.song.hasVideo}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>

    {totalPages > 1 && (
      <div className="flex items-center justify-center gap-3 text-sm text-zinc-400">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent"
          aria-label={t("list_prev_page")}
        >
          ‹
        </button>
        <span>{t("list_page_of", { page, total: totalPages })}</span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent"
          aria-label={t("list_next_page")}
        >
          ›
        </button>
      </div>
    )}
    </div>
  );
}
