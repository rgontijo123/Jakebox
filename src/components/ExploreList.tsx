"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLocale } from "@/lib/i18n/LocaleProvider";

type PublicSong = {
  id: string;
  title: string;
  style: string;
  national: boolean;
  durationSeconds: number;
  cover: string | null;
  audio: string;
  votes: number;
  voted: boolean;
  onRadio: boolean;
};

type Sort = "top" | "new";
type Filter = "" | "national" | "international";

export function ExploreList() {
  const { t } = useLocale();
  const [sort, setSort] = useState<Sort>("top");
  const [filter, setFilter] = useState<Filter>("");
  const [songs, setSongs] = useState<PublicSong[] | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [signedIn, setSignedIn] = useState(false);
  const [canManageRadio, setCanManageRadio] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const load = useCallback(async (s: Sort, f: Filter, p: number) => {
    const params = new URLSearchParams({ sort: s, page: String(p) });
    if (f) params.set("filter", f);
    const res = await fetch(`/api/explore?${params}`, { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setSongs((prev) => (p === 1 ? data.songs : [...(prev ?? []), ...data.songs]));
    setTotal(data.total);
    setSignedIn(data.signedIn);
    setCanManageRadio(data.canManageRadio);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reload the list for a new sort/filter
    setPage(1);
    load(sort, filter, 1);
  }, [sort, filter, load]);

  function togglePlay(song: PublicSong) {
    const audio = audioRef.current;
    if (!audio) return;
    if (playingId === song.id) {
      audio.pause();
      setPlayingId(null);
      return;
    }
    audio.src = song.audio;
    audio.play().then(() => setPlayingId(song.id)).catch(() => setPlayingId(null));
  }

  async function vote(song: PublicSong) {
    if (!signedIn) {
      window.location.assign(`/login?next=${encodeURIComponent("/explore")}`);
      return;
    }
    const res = await fetch(`/api/songs/${song.id}/vote`, { method: "POST" });
    if (!res.ok) return;
    const data = await res.json();
    setSongs((list) => list?.map((s) => (s.id === song.id ? { ...s, votes: data.votes, voted: data.voted } : s)) ?? null);
  }

  async function toggleRadio(song: PublicSong) {
    const res = await fetch(`/api/songs/${song.id}/radio`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ on: !song.onRadio }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setSongs((list) => list?.map((s) => (s.id === song.id ? { ...s, onRadio: data.onRadio } : s)) ?? null);
  }

  const chip = (active: boolean) =>
    `rounded-full px-3.5 py-1.5 text-sm transition-colors ${
      active ? "bg-zinc-100 text-black font-medium" : "border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-600"
    }`;

  return (
    <div className="flex flex-col gap-5">
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} preload="none" />

      <div className="flex flex-wrap items-center gap-2">
        <button className={chip(sort === "top")} onClick={() => setSort("top")}>
          {t("explore_top")}
        </button>
        <button className={chip(sort === "new")} onClick={() => setSort("new")}>
          {t("explore_new")}
        </button>
        <span className="mx-1 h-5 w-px bg-zinc-800" aria-hidden="true" />
        <button className={chip(filter === "")} onClick={() => setFilter("")}>
          {t("explore_all")}
        </button>
        <button className={chip(filter === "national")} onClick={() => setFilter("national")}>
          {t("explore_national")}
        </button>
        <button className={chip(filter === "international")} onClick={() => setFilter("international")}>
          {t("explore_international")}
        </button>
      </div>

      {songs === null ? (
        <p className="text-sm text-zinc-500">…</p>
      ) : songs.length === 0 ? (
        <p className="text-sm text-zinc-400 rounded-2xl border border-zinc-800 p-6 text-center">{t("explore_empty")}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {songs.map((song, i) => (
            <li key={song.id} className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3 min-w-0">
              {sort === "top" && <span className="w-5 shrink-0 text-center text-sm font-semibold text-zinc-600 tabular-nums">{i + 1}</span>}
              <button
                onClick={() => togglePlay(song)}
                className="relative shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-zinc-900 group"
                aria-label={song.title}
              >
                {song.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={song.cover} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Image src="/branding/jake-logo.svg" alt="" width={34} height={34} className="m-auto mt-[15px]" />
                )}
                <span
                  className={`absolute inset-0 flex items-center justify-center bg-black/45 text-white transition-opacity ${
                    playingId === song.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  {playingId === song.id ? "❚❚" : "▶"}
                </span>
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-100 truncate">{song.title}</p>
                <p className="flex items-center gap-1.5 text-xs text-zinc-500 min-w-0">
                  <span
                    className={`shrink-0 rounded px-1 text-[10px] font-semibold leading-4 ${
                      song.national ? "bg-emerald-500/15 text-emerald-300" : "bg-sky-500/15 text-sky-300"
                    }`}
                  >
                    {song.national ? "BR" : "INTL"}
                  </span>
                  <span className="truncate">{song.style}</span>
                </p>
                {song.onRadio && <p className="mt-0.5 text-[11px] text-[#F5B900]">📻 {t("explore_on_radio")}</p>}
              </div>
              <div className="flex shrink-0 flex-col items-center gap-1.5">
                <button
                  onClick={() => vote(song)}
                  title={signedIn ? (song.voted ? t("explore_voted") : t("explore_vote")) : t("explore_login_to_vote")}
                  aria-pressed={song.voted}
                  className={`flex min-w-[52px] items-center justify-center gap-1 rounded-full px-2.5 py-1 text-sm tabular-nums transition-colors ${
                    song.voted ? "bg-rose-500/20 text-rose-300 ring-1 ring-rose-400/60" : "border border-zinc-800 text-zinc-400 hover:text-rose-300"
                  }`}
                >
                  {song.voted ? "♥" : "♡"} {song.votes}
                </button>
                {canManageRadio && (
                  <button
                    onClick={() => toggleRadio(song)}
                    title={song.onRadio ? t("list_radio_remove") : t("list_radio_add")}
                    aria-pressed={song.onRadio}
                    className={`w-8 h-8 rounded-full text-sm ${song.onRadio ? "bg-[#F5B900]/20 ring-1 ring-[#F5B900]" : "opacity-40 hover:opacity-100"}`}
                  >
                    📻
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {songs && songs.length < total && (
        <button
          onClick={() => {
            const next = page + 1;
            setPage(next);
            load(sort, filter, next);
          }}
          className="self-center rounded-full border border-zinc-700 px-5 py-2 text-sm text-zinc-300 hover:border-zinc-500"
        >
          {t("explore_more")}
        </button>
      )}
    </div>
  );
}
