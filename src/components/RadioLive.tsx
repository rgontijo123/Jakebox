"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { RadioItem } from "@/lib/radio";

type Programme = { items: RadioItem[]; cycleMs: number; skewMs: number };

/** Where the shared loop is right now (same maths as positionAt in lib/radio,
 * run against the server clock so every listener lines up). */
function locate(p: Programme): { index: number; offsetMs: number } {
  if (!p.cycleMs) return { index: -1, offsetMs: 0 };
  let t = (Date.now() + p.skewMs - Date.UTC(2026, 0, 1)) % p.cycleMs;
  for (let i = 0; i < p.items.length; i++) {
    if (t < p.items[i].durationMs) return { index: i, offsetMs: t };
    t -= p.items[i].durationMs;
  }
  return { index: 0, offsetMs: 0 };
}

async function fetchProgramme(): Promise<Programme> {
  const sent = Date.now();
  const res = await fetch("/api/radio", { cache: "no-store" });
  const data = await res.json();
  const received = Date.now();
  // Server clock at the midpoint of the request vs ours.
  const skewMs = data.now - (sent + received) / 2;
  return { items: data.items, cycleMs: data.cycleMs, skewMs };
}

function fmt(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function RadioLive() {
  const { t } = useLocale();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [programme, setProgramme] = useState<Programme | null>(null);
  const [index, setIndex] = useState(-1);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [volume, setVolume] = useState(0.9);
  const playingRef = useRef(false);

  // Initial load, and keep the "now playing" card live while not listening.
  useEffect(() => {
    let alive = true;
    const refresh = () =>
      fetchProgramme()
        .then((p) => alive && setProgramme(p))
        .catch(() => {});
    refresh();
    const id = setInterval(refresh, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!programme || playing) return;
    const tick = () => {
      const pos = locate(programme);
      setIndex(pos.index);
      setElapsedMs(pos.offsetMs);
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [programme, playing]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const start = useCallback(async (p: Programme, i: number, offsetMs: number) => {
    const audio = audioRef.current;
    const item = p.items[i];
    if (!audio || !item) return;
    setIndex(i);
    setElapsedMs(offsetMs);
    audio.src = item.audio;
    audio.currentTime = offsetMs / 1000;
    try {
      await audio.play();
    } catch {
      playingRef.current = false;
      setPlaying(false);
      return;
    }
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: item.kind === "jingle" ? "Rádio Jakebox" : item.title,
        artist: "Rádio Jakebox",
        album: item.style ?? "jakeboxmusic.com",
        artwork: [{ src: item.cover ?? "/icons/icon-512.png", sizes: "512x512", type: item.cover ? "image/jpeg" : "image/png" }],
      });
    }
  }, []);

  async function listen() {
    setLoading(true);
    try {
      const p = await fetchProgramme();
      setProgramme(p);
      const pos = locate(p);
      if (pos.index < 0) return;
      playingRef.current = true;
      setPlaying(true);
      await start(p, pos.index, pos.offsetMs);
    } finally {
      setLoading(false);
    }
  }

  function pause() {
    playingRef.current = false;
    setPlaying(false);
    audioRef.current?.pause();
  }

  // Next item: resync to the live clock if it says we're already into it,
  // else start it from the top (small drift between tracks is fine).
  async function handleEnded() {
    if (!playingRef.current) return;
    const p = await fetchProgramme().catch(() => programme);
    if (!p || !p.items.length) return pause();
    setProgramme(p);
    const pos = locate(p);
    const currentId = programme?.items[index]?.id;
    const next = p.items[pos.index]?.id === currentId ? (pos.index + 1) % p.items.length : pos.index;
    await start(p, next, next === pos.index ? pos.offsetMs : 0);
  }

  const items = programme?.items ?? [];
  const current = index >= 0 ? items[index] : null;
  const upNext = items.length > 1 ? items.slice(index + 1).concat(items.slice(0, index + 1)).filter((it) => it.kind === "song").slice(0, 3) : [];
  const empty = programme && !items.length;

  return (
    <div className="w-full flex flex-col gap-6">
      <audio
        ref={audioRef}
        preload="none"
        onTimeUpdate={(e) => playing && setElapsedMs(e.currentTarget.currentTime * 1000)}
        onEnded={handleEnded}
        onError={handleEnded}
      />

      <div className="rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-black/60 p-5 sm:p-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
        <div className="relative shrink-0 w-56 h-56 sm:w-64 sm:h-64 rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          {current?.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current.cover} alt="" className="w-full h-full object-cover" />
          ) : (
            <Image src="/branding/jake-logo.svg" alt="" width={120} height={120} className={playing ? "animate-pulse" : ""} />
          )}
          <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-bold tracking-wider text-white">
            <span className={`h-1.5 w-1.5 rounded-full bg-white ${playing ? "animate-pulse" : ""}`} />
            {t("radio_live")}
          </span>
        </div>

        <div className="flex-1 min-w-0 w-full flex flex-col gap-4 text-center sm:text-left">
          {empty ? (
            <p className="text-zinc-400">{t("radio_empty")}</p>
          ) : (
            <>
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#F5B900]">{t("radio_now")}</p>
                <h2 className="mt-1 text-2xl sm:text-3xl font-semibold leading-tight break-words">
                  {current ? (current.kind === "jingle" ? t("radio_jingle") : current.title) : "…"}
                </h2>
                {current?.style && <p className="mt-1 text-sm text-zinc-400 truncate">{current.style}</p>}
              </div>

              <div className="flex flex-col gap-1">
                <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-[#F5B900] transition-[width] duration-500"
                    style={{ width: current ? `${Math.min(100, (elapsedMs / current.durationMs) * 100)}%` : "0%" }}
                  />
                </div>
                <div className="flex justify-between text-xs text-zinc-500 tabular-nums">
                  <span>{fmt(elapsedMs)}</span>
                  <span>{current ? fmt(current.durationMs) : "0:00"}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                <button
                  onClick={playing ? pause : listen}
                  disabled={loading || !items.length}
                  className="flex items-center gap-2 rounded-full bg-[#F5B900] text-black px-6 py-3 text-sm font-semibold hover:bg-[#ffd23f] transition-colors disabled:opacity-50"
                >
                  {playing ? (
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                      <rect x="3" y="2" width="4" height="12" />
                      <rect x="9" y="2" width="4" height="12" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                      <path d="M4 2 L14 8 L4 14 Z" />
                    </svg>
                  )}
                  {playing ? t("radio_pause") : t("radio_listen")}
                </button>
                <label className="flex items-center gap-2 text-xs text-zinc-500">
                  <span aria-hidden="true">🔊</span>
                  <span className="sr-only">{t("radio_volume")}</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-28 accent-[#F5B900]"
                  />
                </label>
              </div>
            </>
          )}
        </div>
      </div>

      {upNext.length > 0 && (
        <div className="rounded-2xl border border-zinc-800 p-5">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-3">{t("radio_next")}</p>
          <ol className="flex flex-col gap-3">
            {upNext.map((it, i) => (
              <li key={`${it.id}-${i}`} className="flex items-center gap-3 min-w-0">
                <div className="shrink-0 w-11 h-11 rounded-lg overflow-hidden bg-zinc-900 flex items-center justify-center">
                  {it.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.cover} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Image src="/branding/jake-logo.svg" alt="" width={26} height={26} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-100 truncate">{it.title}</p>
                  {it.style && <p className="text-xs text-zinc-500 truncate">{it.style}</p>}
                </div>
                <span className="ml-auto text-xs text-zinc-600 tabular-nums">{fmt(it.durationMs)}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
