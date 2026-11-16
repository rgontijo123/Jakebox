"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { RADIO_EPOCH, STATION_TZ, partOfDay, type RadioItem } from "@/lib/radioShared";

type Programme = { items: RadioItem[]; cycleMs: number; skewMs: number };

/** Where the shared loop is right now (same maths as positionAt in lib/radio,
 * against the server clock so every listener lines up). */
function locate(p: Programme): { index: number; offsetMs: number } {
  if (!p.cycleMs) return { index: -1, offsetMs: 0 };
  let t = (Date.now() + p.skewMs - RADIO_EPOCH) % p.cycleMs;
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
  const skewMs = data.now - (sent + Date.now()) / 2;
  return { items: data.items, cycleMs: data.cycleMs, skewMs };
}

const fmt = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** Rotary volume knob: drag up/down, mouse wheel or arrow keys. */
function VolumeKnob({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const drag = useRef<{ y: number; v: number } | null>(null);
  const set = (v: number) => onChange(Math.min(1, Math.max(0, Math.round(v * 100) / 100)));
  const angle = -135 + value * 270;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value * 100)}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { y: e.clientY, v: value };
        }}
        onPointerMove={(e) => drag.current && set(drag.current.v + (drag.current.y - e.clientY) / 150)}
        onPointerUp={() => (drag.current = null)}
        onWheel={(e) => set(value - Math.sign(e.deltaY) * 0.05)}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp" || e.key === "ArrowRight") set(value + 0.05);
          if (e.key === "ArrowDown" || e.key === "ArrowLeft") set(value - 0.05);
        }}
        className="relative h-16 w-16 cursor-ns-resize touch-none select-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#F5B900]
          bg-[radial-gradient(circle_at_35%_30%,#5a5a60,#26262a_60%,#18181b)] shadow-[0_6px_14px_rgba(0,0,0,.6),inset_0_1px_1px_rgba(255,255,255,.18)]"
      >
        <div
          className="absolute inset-[7px] rounded-full bg-[repeating-conic-gradient(#3a3a3f_0deg_6deg,#2c2c30_6deg_12deg)] shadow-[inset_0_2px_4px_rgba(0,0,0,.6)]"
          style={{ transform: `rotate(${angle}deg)` }}
        >
          <span className="absolute left-1/2 top-1 h-3 w-1 -translate-x-1/2 rounded-full bg-[#F5B900] shadow-[0_0_6px_#F5B900]" />
        </div>
      </div>
      <span className="text-[10px] font-semibold tracking-[0.2em] text-zinc-500">VOL</span>
    </div>
  );
}

function RadioButton({
  onClick,
  label,
  active,
  disabled,
  children,
}: {
  onClick: () => void;
  label: string;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        aria-pressed={active}
        className={`flex h-14 w-14 items-center justify-center rounded-2xl text-zinc-100 transition-all
          bg-gradient-to-b from-[#3b3b40] to-[#202024] border border-black/60
          shadow-[0_5px_0_#0b0b0d,0_8px_14px_rgba(0,0,0,.5),inset_0_1px_0_rgba(255,255,255,.15)]
          active:translate-y-[4px] active:shadow-[0_1px_0_#0b0b0d,0_2px_6px_rgba(0,0,0,.5),inset_0_1px_0_rgba(255,255,255,.1)]
          disabled:opacity-40 ${active ? "text-[#F5B900] translate-y-[3px] shadow-[0_2px_0_#0b0b0d,0_3px_8px_rgba(0,0,0,.5),inset_0_1px_0_rgba(255,255,255,.1)]" : ""}`}
      >
        {children}
      </button>
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">{label}</span>
    </div>
  );
}

export function RadioLive() {
  const { t } = useLocale();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [programme, setProgramme] = useState<Programme | null>(null);
  const [index, setIndex] = useState(-1);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [clock, setClock] = useState("");
  const playingRef = useRef(false);

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

  // Keep the display live while not listening, and the station clock ticking.
  useEffect(() => {
    const tick = () => {
      const skew = programme?.skewMs ?? 0;
      setClock(new Intl.DateTimeFormat("pt-BR", { timeZone: STATION_TZ, hour: "2-digit", minute: "2-digit" }).format(Date.now() + skew));
      if (programme && !playingRef.current) {
        const pos = locate(programme);
        setIndex(pos.index);
        setElapsedMs(pos.offsetMs);
      }
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [programme]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
    audioRef.current.muted = muted;
  }, [volume, muted]);

  const start = useCallback(async (p: Programme, i: number, offsetMs: number) => {
    const audio = audioRef.current;
    const item = p.items[i];
    if (!audio || !item) return;
    setIndex(i);
    setElapsedMs(offsetMs);
    // Greetings come in morning/afternoon/evening takes -- station time.
    audio.src = item.variants ? item.variants[partOfDay(Date.now() + p.skewMs)] : item.audio;
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
        title: item.kind === "song" ? item.title : "Rádio Jakebox",
        artist: "Rádio Jakebox",
        album: "jakeboxmusic.com",
        artwork: [{ src: item.cover ?? "/icons/icon-512.png", sizes: "512x512", type: item.cover ? "image/jpeg" : "image/png" }],
      });
    }
  }, []);

  async function play() {
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

  function stop() {
    playingRef.current = false;
    setPlaying(false);
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
  }

  // Next item: resync to the live clock if it says we're already into it,
  // else start it from the top (small drift between items is fine).
  async function handleEnded() {
    if (!playingRef.current) return;
    const p = await fetchProgramme().catch(() => programme);
    if (!p || !p.items.length) return stop();
    setProgramme(p);
    const pos = locate(p);
    const currentId = programme?.items[index]?.id;
    const next = p.items[pos.index]?.id === currentId ? (pos.index + 1) % p.items.length : pos.index;
    await start(p, next, next === pos.index ? pos.offsetMs : 0);
  }

  const items = programme?.items ?? [];
  const current = index >= 0 ? items[index] : null;
  const empty = programme && !items.length;
  // During an intro the song it announces is "now", not "next".
  const nowSongId = current?.kind === "intro" ? current.id.replace(/^intro-/, "") : current?.id;
  const upNext =
    items.length > 1
      ? items
          .slice(index + 1)
          .concat(items.slice(0, index + 1))
          .filter((it) => it.kind === "song" && it.id !== nowSongId)
          .slice(0, 3)
      : [];
  const line = empty
    ? t("radio_empty")
    : !current
      ? "…"
      : current.kind === "song"
        ? `${current.title}${current.style ? `  ·  ${current.style}` : ""}`
        : current.kind === "intro"
          ? `${t("radio_intro")}: ${current.title}`
          : `${t("radio_title")} · ${t("radio_live")}`;
  const progress = current ? Math.min(1, elapsedMs / current.durationMs) : 0;
  const cover = current?.cover ?? null;

  return (
    <div className="w-full flex flex-col gap-6">
      <audio
        ref={audioRef}
        preload="none"
        onTimeUpdate={(e) => playingRef.current && setElapsedMs(e.currentTarget.currentTime * 1000)}
        onEnded={handleEnded}
        onError={() => playingRef.current && handleEnded()}
      />

      {/* the radio */}
      <div className="relative rounded-[28px] border border-black/70 bg-gradient-to-b from-[#2b2b30] via-[#1c1c20] to-[#121214] p-4 sm:p-6 shadow-[0_30px_60px_rgba(0,0,0,.55),inset_0_1px_0_rgba(255,255,255,.12),inset_0_-2px_0_rgba(0,0,0,.6)]">
        {/* top plate */}
        <div className="mb-4 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Image src="/branding/jake-logo.svg" alt="Jakebox" width={30} height={30} />
            <span className="bg-gradient-to-b from-zinc-100 to-zinc-400 bg-clip-text text-sm font-bold tracking-[0.3em] text-transparent">JAKEBOX</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.2em] text-zinc-500">
            <span
              className={`h-2.5 w-2.5 rounded-full ${playing ? "bg-red-500 shadow-[0_0_10px_2px_rgba(239,68,68,.8)]" : "bg-red-950"}`}
              aria-hidden="true"
            />
            {t("radio_live")}
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6 sm:grid-cols-[auto_1fr] items-center">
          {/* speaker with the cover as the cone's label */}
          <div className="mx-auto relative h-40 w-40 sm:h-48 sm:w-48 rounded-full p-2 bg-gradient-to-b from-[#3a3a40] to-[#18181b] shadow-[inset_0_2px_6px_rgba(0,0,0,.8),0_1px_0_rgba(255,255,255,.08)]">
            <div className="h-full w-full rounded-full bg-[#0d0d0f] bg-[radial-gradient(circle,#2e2e33_1.4px,transparent_1.6px)] [background-size:7px_7px] flex items-center justify-center">
              <div
                className={`h-[44%] w-[44%] overflow-hidden rounded-full ring-4 ring-black/70 bg-zinc-900 flex items-center justify-center shadow-[0_0_0_6px_rgba(255,255,255,.03)] ${
                  playing ? "animate-[spin_8s_linear_infinite]" : ""
                }`}
              >
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cover} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Image src="/branding/jake-logo.svg" alt="" width={44} height={44} />
                )}
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            {/* LCD */}
            <div
              className={`min-w-0 rounded-xl border border-black p-3 font-mono transition-colors ${
                playing ? "bg-[#2a2006] text-[#ffcf4a] [text-shadow:0_0_6px_rgba(255,190,40,.55)]" : "bg-[#1a1608] text-[#8a7330]"
              } shadow-[inset_0_2px_8px_rgba(0,0,0,.8)]`}
            >
              <div className="flex items-center justify-between text-[11px] tracking-widest opacity-80">
                <span>JKB · 24H</span>
                <span className="flex items-end gap-[2px] h-3" aria-hidden="true">
                  {[0, 1, 2, 3, 4].map((b) => (
                    <span
                      key={b}
                      className={`w-[3px] rounded-sm bg-current ${playing ? "animate-[eq_0.9s_ease-in-out_infinite]" : "h-[3px]"}`}
                      style={playing ? { animationDelay: `${b * 0.13}s` } : undefined}
                    />
                  ))}
                </span>
                <span>{clock}</span>
              </div>
              <div className="mt-2 overflow-hidden whitespace-nowrap text-sm" title={line}>
                <span className={line.length > 34 ? "inline-block animate-[marquee_16s_linear_infinite] pl-[100%]" : ""}>{line}</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[11px] tabular-nums">
                <span>{fmt(elapsedMs)}</span>
                <div className="flex flex-1 gap-[2px]" aria-hidden="true">
                  {Array.from({ length: 24 }, (_, i) => (
                    <span key={i} className={`h-1.5 flex-1 rounded-[1px] ${i / 24 < progress ? "bg-current" : "bg-current opacity-15"}`} />
                  ))}
                </div>
                <span>{current ? fmt(current.durationMs) : "0:00"}</span>
              </div>
            </div>

            {/* controls */}
            <div className="flex items-end justify-center sm:justify-start gap-4 sm:gap-5">
              <RadioButton onClick={play} label="Play" active={playing} disabled={loading || !items.length || playing}>
                <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M4 2 L14 8 L4 14 Z" />
                </svg>
              </RadioButton>
              <RadioButton onClick={stop} label={t("radio_stop")} disabled={!playing}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <rect x="3" y="3" width="10" height="10" rx="1" />
                </svg>
              </RadioButton>
              <RadioButton onClick={() => setMuted((m) => !m)} label={muted ? t("radio_unmute") : t("radio_mute")} active={muted}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor" />
                  {muted ? <path d="m16 9 5 6m0-6-5 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />}
                </svg>
              </RadioButton>
              <div className="ml-auto sm:ml-4">
                <VolumeKnob value={volume} onChange={setVolume} label={t("radio_volume")} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {upNext.length > 0 && (
        <div className="px-1">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">{t("radio_next")}</p>
          <ol className="flex flex-col divide-y divide-zinc-900">
            {upNext.map((it, i) => (
              <li key={`${it.id}-${i}`} className="flex items-center gap-3 py-2 min-w-0 text-sm">
                <span className="truncate text-zinc-300">{it.title}</span>
                <span className="ml-auto shrink-0 text-xs text-zinc-600 tabular-nums">{fmt(it.durationMs)}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
