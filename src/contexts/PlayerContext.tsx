"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { WordTimestamp } from "@/lib/lyrics";

export type PlayableSong = {
  songId: string;
  title: string;
  stylePrompt: string;
  lyricsText: string;
  wordTimestamps: WordTimestamp[] | null;
};

type PlayerState = {
  current: PlayableSong | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  play: (song: PlayableSong) => void;
  toggle: () => void;
  seek: (t: number) => void;
};

const PlayerContext = createContext<PlayerState | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [current, setCurrent] = useState<PlayableSong | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration);
    const onEnd = () => setIsPlaying(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  function play(song: PlayableSong) {
    const audio = audioRef.current;
    if (!audio) return;

    if (current?.songId === song.songId) {
      toggle();
      return;
    }

    setCurrent(song);
    setCurrentTime(0);
    audio.src = `/api/songs/${song.songId}/audio`;
    audio.play();
    setIsPlaying(true);
  }

  function toggle() {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  }

  function seek(t: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = t;
    setCurrentTime(t);
  }

  return (
    <PlayerContext.Provider value={{ current, isPlaying, currentTime, duration, play, toggle, seek }}>
      {children}
      <audio ref={audioRef} preload="metadata" />
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerState {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within a PlayerProvider");
  return ctx;
}
