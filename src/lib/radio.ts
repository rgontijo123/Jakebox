import { db } from "@/lib/db";
import jingles from "../../public/radio/jingles.json";
import greetings from "../../public/radio/greetings.json";
import { readSongAudio } from "@/lib/storage";
import { exactDurationMs } from "@/lib/exactDuration";
import { RADIO_EPOCH, RADIO_VOICES, type RadioItem, type RadioLang } from "@/lib/radioShared";

export {
  RADIO_EPOCH,
  partOfDay,
  type RadioItem,
  type RadioLang,
} from "@/lib/radioShared";

/** Rádio Jakebox: a fake "live" station with no streaming server. The
 * programme is a fixed loop that has been "playing" since EPOCH; every
 * listener derives the same position from the server clock, so everyone
 * hears the same thing at the same moment -- and a page refresh lands on the
 * same song at the same second. That only holds if every item's length is
 * exact, hence radioDurationMs (decoded length) instead of durationSeconds.
 *
 * Loop shape: national (Portuguese) and international songs alternate.
 * Before every song: the announcer's time-of-day greeting ("Boa tarde! Você
 * está ouvindo a Rádio Jakebox...", in the song's language) and the song's
 * own intro ("...Agora: <title>"); every JINGLE_EVERY songs the sung jingle
 * opens the break. */
const JINGLE_EVERY = 3;

type Jingle = { file: string; durationMs: number };
type GreetingSet = Record<RadioLang, Record<string, Record<"morning" | "afternoon" | "evening", Jingle>>>;

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

const measuring = new Map<string, Promise<void>>();

/** Fills in exact lengths for on-air songs/intros that don't have one yet
 * (songs put on air before radioDurationMs existed; intros stored rounded to
 * whole seconds). Runs once per song, then it's in the DB. */
async function ensureExactDurations(
  songs: {
    id: string;
    audioUrl: string;
    radioDurationMs: number | null;
    radioIntroKey: string | null;
    radioIntroMs: number | null;
  }[],
): Promise<void> {
  // One at a time: each decode is an ffmpeg process, and the server has 512MB.
  for (const s of songs.filter(
    (s) =>
      s.radioDurationMs == null ||
      (s.radioIntroKey &&
        s.radioIntroMs != null &&
        s.radioIntroMs % 1000 === 0),
  )) {
    await (() => {
      let job = measuring.get(s.id);
      if (!job) {
        job = (async () => {
          const data: { radioDurationMs?: number; radioIntroMs?: number } = {};
          if (s.radioDurationMs == null)
            data.radioDurationMs = await exactDurationMs(
              await readSongAudio(s.audioUrl),
            );
          if (
            s.radioIntroKey &&
            s.radioIntroMs != null &&
            s.radioIntroMs % 1000 === 0
          ) {
            const ms = await exactDurationMs(
              await readSongAudio(s.radioIntroKey),
            );
            // a whole-second value marks "not measured yet", so never store one
            data.radioIntroMs = ms % 1000 === 0 ? ms + 1 : ms;
          }
          await db.song.update({ where: { id: s.id }, data });
          Object.assign(s, data);
        })()
          .catch((err) =>
            console.error(`Radio duration for ${s.id} failed:`, err),
          )
          .finally(() => measuring.delete(s.id));
        measuring.set(s.id, job);
      }
      return job;
    })();
  }
}

export async function getRadioProgramme(): Promise<RadioItem[]> {
  const songs = await db.song.findMany({
    where: { radioAt: { not: null }, deletedAt: null },
    orderBy: { radioAt: "asc" },
    select: {
      id: true,
      title: true,
      audioUrl: true,
      durationSeconds: true,
      radioDurationMs: true,
      thumbnailUrl: true,
      radioIntroKey: true,
      radioIntroMs: true,
      radioVoice: true,
      generation: { select: { stylePrompt: true, language: true } },
    },
  });
  await ensureExactDurations(songs);
  const ordered = interleave(
    songs.filter((s) => isNational(s.generation.language)),
    songs.filter((s) => !isNational(s.generation.language)),
  );

  const items: RadioItem[] = [];
  const pool = jingles as Jingle[];
  const greet = greetings as unknown as GreetingSet;
  const turn: Record<RadioLang, number> = { pt: 0, en: 0 };
  ordered.forEach((s, i) => {
    const lang: RadioLang = isNational(s.generation.language) ? "pt" : "en";
    if (pool.length && i % JINGLE_EVERY === 0) {
      const j = pool[(i / JINGLE_EVERY) % pool.length];
      items.push({
        kind: "jingle",
        id: `${j.file}#${i}`,
        title: "Rádio Jakebox",
        style: null,
        durationMs: j.durationMs,
        audio: `/radio/${j.file}`,
        cover: null,
      });
    }
    // Same announcer for the greeting and the intro of this song; songs with
    // no intro rotate through the saved greeting voices (no new generations).
    const hasIntro = !!(s.radioIntroKey && s.radioIntroMs);
    const voice = hasIntro && s.radioVoice ? s.radioVoice : RADIO_VOICES[turn[lang]++ % RADIO_VOICES.length];
    const set = greet[lang]?.[voice] ?? greet[lang]?.male;
    if (set) {
      // The three takes are cut to the same length, so the slot is exact
      // whichever one plays.
      items.push({
        kind: "greeting",
        id: `greeting-${lang}-${voice}#${i}`,
        title: lang === "pt" ? "Rádio Jakebox" : "Jakebox Radio",
        style: null,
        durationMs: set.afternoon.durationMs,
        audio: `/radio/${set.afternoon.file}`,
        cover: null,
        variants: {
          morning: `/radio/${set.morning.file}`,
          afternoon: `/radio/${set.afternoon.file}`,
          evening: `/radio/${set.evening.file}`,
        },
      });
    }
    const cover = s.thumbnailUrl ? `/api/radio/cover/${s.id}` : null;
    if (s.radioIntroKey && s.radioIntroMs) {
      items.push({
        kind: "intro",
        id: `intro-${s.id}`,
        title: s.title,
        style: null,
        durationMs: s.radioIntroMs,
        audio: `/api/radio/intro/${s.id}?v=${s.radioIntroMs}`,
        cover,
      });
    }
    items.push({
      kind: "song",
      id: s.id,
      title: s.title,
      style: shortStyle(s.generation.stylePrompt),
      durationMs: s.radioDurationMs ?? s.durationSeconds * 1000,
      audio: `/api/radio/audio/${s.id}`,
      cover,
    });
  });
  return items;
}

/** Where the loop is at `now`: index of the current item and ms into it. */
export function positionAt(
  items: RadioItem[],
  now: number,
): { index: number; offsetMs: number; cycleMs: number } {
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
