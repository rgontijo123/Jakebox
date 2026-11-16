import { db } from "@/lib/db";
import jingles from "../../public/radio/jingles.json";
import greetings from "../../public/radio/greetings.json";

/** Rádio Jakebox: a fake "live" station with no streaming server. The
 * programme is a fixed loop that has been "playing" since EPOCH; every
 * listener derives the same position from the server clock, so everyone
 * hears the same thing at the same moment. Adding/removing a song rebuilds
 * the loop, which is fine for a station this size.
 *
 * Loop shape: national (Portuguese) and international songs alternate; each
 * song is preceded by its announcer intro ("...Agora: <title>") when it has
 * one; every few songs there's a station break -- alternately the
 * announcer's time-of-day greeting ("Boa tarde! Você está ouvindo...") and
 * a sung jingle. */
import { RADIO_EPOCH, type RadioItem, type RadioLang } from "@/lib/radioShared";

export { RADIO_EPOCH, partOfDay, type RadioItem, type RadioLang } from "@/lib/radioShared";
const BREAK_EVERY = 2;

type Jingle = { file: string; durationMs: number };
type GreetingSet = Record<RadioLang, Record<"morning" | "afternoon" | "evening", Jingle>>;

export function isNational(language: string | null | undefined): boolean {
  return (language ?? "").toLowerCase().startsWith("pt");
}

/** Alternate national / international, each group keeping on-air order. */
function interleave<T>(a: T[], b: T[]): T[] {
  const out: T[] = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (i < a.length) out.push(a[i]);
    if (i < b.length) out.push(b[i]);
  }
  return out;
}

export async function getRadioProgramme(): Promise<RadioItem[]> {
  const songs = await db.song.findMany({
    where: { radioAt: { not: null }, deletedAt: null },
    orderBy: { radioAt: "asc" },
    select: {
      id: true,
      title: true,
      durationSeconds: true,
      thumbnailUrl: true,
      radioIntroKey: true,
      radioIntroMs: true,
      generation: { select: { stylePrompt: true, language: true } },
    },
  });
  const ordered = interleave(
    songs.filter((s) => isNational(s.generation.language)),
    songs.filter((s) => !isNational(s.generation.language)),
  );

  const items: RadioItem[] = [];
  const pool = jingles as Jingle[];
  const greet = greetings as GreetingSet;
  ordered.forEach((s, i) => {
    const lang: RadioLang = isNational(s.generation.language) ? "pt" : "en";
    if (i % BREAK_EVERY === 0) {
      const breakNo = i / BREAK_EVERY;
      if (breakNo % 2 === 0 && greet[lang]) {
        const set = greet[lang];
        items.push({
          kind: "greeting",
          id: `greeting-${lang}`,
          title: lang === "pt" ? "Rádio Jakebox" : "Jakebox Radio",
          style: null,
          // One slot length for all three takes; a shorter take just hands
          // over to the next item a moment early.
          durationMs: Math.max(set.morning.durationMs, set.afternoon.durationMs, set.evening.durationMs),
          audio: `/radio/${set.afternoon.file}`,
          cover: null,
          variants: {
            morning: `/radio/${set.morning.file}`,
            afternoon: `/radio/${set.afternoon.file}`,
            evening: `/radio/${set.evening.file}`,
          },
        });
      } else if (pool.length) {
        const j = pool[Math.floor(breakNo / 2) % pool.length];
        items.push({ kind: "jingle", id: j.file, title: "Rádio Jakebox", style: null, durationMs: j.durationMs, audio: `/radio/${j.file}`, cover: null });
      }
    }
    const cover = s.thumbnailUrl ? `/api/radio/cover/${s.id}` : null;
    if (s.radioIntroKey && s.radioIntroMs) {
      items.push({ kind: "intro", id: `intro-${s.id}`, title: s.title, style: null, durationMs: s.radioIntroMs, audio: `/api/radio/intro/${s.id}`, cover });
    }
    items.push({
      kind: "song",
      id: s.id,
      title: s.title,
      style: shortStyle(s.generation.stylePrompt),
      durationMs: s.durationSeconds * 1000,
      audio: `/api/radio/audio/${s.id}`,
      cover,
    });
  });
  return items;
}

/** Where the loop is at `now`: index of the current item and ms into it. */
export function positionAt(items: RadioItem[], now: number): { index: number; offsetMs: number; cycleMs: number } {
  const cycleMs = items.reduce((sum, it) => sum + it.durationMs, 0);
  if (!cycleMs) return { index: -1, offsetMs: 0, cycleMs: 0 };
  let t = (now - RADIO_EPOCH) % cycleMs;
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
