import { db } from "@/lib/db";
import jingles from "../../public/radio/jingles.json";

/** Rádio Jakebox: a fake "live" station with no streaming server. The
 * programme is a fixed loop (songs in the order they were put on air, a
 * jingle after every JINGLE_EVERY songs) that has been "playing" since
 * EPOCH; every listener derives the same position from the clock, so
 * everyone hears the same thing at the same moment. Adding/removing a
 * song reshuffles the loop, which is fine for a station this size. */
const EPOCH = Date.UTC(2026, 0, 1);
const JINGLE_EVERY = 2;

export type RadioItem = {
  kind: "song" | "jingle";
  id: string;
  title: string;
  style: string | null;
  durationMs: number;
  audio: string;
  cover: string | null;
};

type Jingle = { file: string; durationMs: number };

export async function getRadioProgramme(): Promise<RadioItem[]> {
  const songs = await db.song.findMany({
    where: { radioAt: { not: null }, deletedAt: null },
    orderBy: { radioAt: "asc" },
    select: {
      id: true,
      title: true,
      durationSeconds: true,
      thumbnailUrl: true,
      generation: { select: { stylePrompt: true } },
    },
  });

  const items: RadioItem[] = [];
  const pool = jingles as Jingle[];
  songs.forEach((s, i) => {
    if (pool.length && i % JINGLE_EVERY === 0) {
      const j = pool[(i / JINGLE_EVERY) % pool.length];
      items.push({ kind: "jingle", id: j.file, title: "Rádio Jakebox", style: null, durationMs: j.durationMs, audio: `/radio/${j.file}`, cover: null });
    }
    items.push({
      kind: "song",
      id: s.id,
      title: s.title,
      style: shortStyle(s.generation.stylePrompt),
      durationMs: s.durationSeconds * 1000,
      audio: `/api/radio/audio/${s.id}`,
      cover: s.thumbnailUrl ? `/api/radio/cover/${s.id}` : null,
    });
  });
  return items;
}

/** Where the loop is at `now`: index of the current item and ms into it. */
export function positionAt(items: RadioItem[], now: number): { index: number; offsetMs: number; cycleMs: number } {
  const cycleMs = items.reduce((sum, it) => sum + it.durationMs, 0);
  if (!cycleMs) return { index: -1, offsetMs: 0, cycleMs: 0 };
  let t = (now - EPOCH) % cycleMs;
  for (let i = 0; i < items.length; i++) {
    if (t < items[i].durationMs) return { index: i, offsetMs: t, cycleMs };
    t -= items[i].durationMs;
  }
  return { index: 0, offsetMs: 0, cycleMs };
}

function shortStyle(prompt: string): string {
  const first = prompt.split(/[,.;]/)[0]?.trim() ?? "";
  return first.length > 60 ? first.slice(0, 57) + "…" : first;
}
