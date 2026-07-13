"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { alignLyrics, activeWordIndex, type WordTimestamp } from "@/lib/lyrics";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function RadioPlayer({
  songId,
  title,
  stylePrompt,
  lyricsText,
  wordTimestamps,
}: {
  songId: string;
  title: string;
  stylePrompt: string;
  lyricsText: string;
  wordTimestamps: WordTimestamp[] | null;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const lines = alignLyrics(lyricsText, wordTimestamps ?? []);
  const currentMs = currentTime * 1000;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration);
    const onEnd = () => setPlaying(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  }

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    if (!audio) return;
    const t = Number(e.target.value);
    audio.currentTime = t;
    setCurrentTime(t);
  }

  return (
    <div className="w-full rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-black p-6 flex flex-col gap-5">
      <audio ref={audioRef} src={`/api/songs/${songId}/audio`} preload="metadata" />

      <div className="flex items-center gap-4">
        <div className={`shrink-0 rounded-full bg-[#F5B900]/10 p-2 ${playing ? "animate-spin-slow" : ""}`}>
          <Image src="/branding/jake-logo.svg" alt="" width={56} height={56} />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold truncate">{title}</h2>
          <p className="text-sm text-zinc-500 truncate">{stylePrompt}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          className="shrink-0 flex items-center justify-center w-11 h-11 rounded-full bg-[#F5B900] text-black hover:bg-[#ffcc33] transition-colors"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="3" y="2" width="4" height="12" />
              <rect x="9" y="2" width="4" height="12" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 2 L14 8 L4 14 Z" />
            </svg>
          )}
        </button>

        <span className="text-xs text-zinc-500 w-9 text-right">{formatTime(currentTime)}</span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={seek}
          className="flex-1 accent-[#F5B900]"
        />
        <span className="text-xs text-zinc-500 w-9">{formatTime(duration)}</span>

        <a
          href={`/api/songs/${songId}/audio?download=1`}
          className="shrink-0 text-xs text-zinc-500 hover:text-zinc-100 underline"
        >
          Download
        </a>
      </div>

      {lines.length > 0 && (
        <div className="max-h-72 overflow-y-auto rounded-lg bg-black/40 p-4 flex flex-col gap-2.5 text-sm leading-relaxed">
          {lines.map((line, i) =>
            line.isTag ? (
              <p key={i} className="text-xs uppercase tracking-wide text-zinc-600 mt-2 first:mt-0">
                {line.text}
              </p>
            ) : (
              <p key={i}>
                {line.words.map((w, j) => {
                  const active = activeWordIndex(line.words, currentMs) === j;
                  const sung = w.startMs !== null && w.startMs <= currentMs;
                  return (
                    <span
                      key={j}
                      className={
                        active
                          ? "text-[#F5B900] font-medium"
                          : sung
                            ? "text-zinc-300"
                            : "text-zinc-500"
                      }
                    >
                      {w.text}{" "}
                    </span>
                  );
                })}
              </p>
            ),
          )}
        </div>
      )}
    </div>
  );
}
