import { spawn } from "node:child_process";
import { db } from "@/lib/db";
import { generateRawSonic } from "@/lib/musicapi";
import { exactDurationMs } from "@/lib/exactDuration";
import { saveSongAudio } from "@/lib/storage";
import { isNational } from "@/lib/radio";
import { RADIO_VOICES, type RadioLang, type RadioVoice } from "@/lib/radioShared";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ffmpegPath: string = require("ffmpeg-static");

const SPOKEN = "talking not singing, radio station intro, no singing, no melody in the vocals";
const VOICE_TAGS: Record<RadioVoice, Record<RadioLang, string>> = {
  male: {
    pt: `spoken word radio announcer, male radio DJ voice speaking, ${SPOKEN}, warm deep Brazilian Portuguese voice, soft light instrumental music bed underneath`,
    en: `spoken word radio announcer, male radio DJ voice speaking, ${SPOKEN}, warm deep American English voice, soft light instrumental music bed underneath`,
  },
  female: {
    pt: `spoken word radio announcer, female radio host voice speaking, ${SPOKEN}, warm smooth Brazilian Portuguese woman's voice, soft light instrumental music bed underneath`,
    en: `spoken word radio announcer, female radio host voice speaking, ${SPOKEN}, warm smooth American English woman's voice, soft light instrumental music bed underneath`,
  },
  young: {
    pt: `spoken word radio announcer, young energetic male DJ voice speaking, ${SPOKEN}, upbeat youthful Brazilian Portuguese voice, punchy light pop music bed underneath`,
    en: `spoken word radio announcer, young energetic male DJ voice speaking, ${SPOKEN}, upbeat youthful American English voice, punchy light pop music bed underneath`,
  },
  cheerful: {
    pt: `spoken word radio announcer, cheerful bubbly young female DJ voice speaking, ${SPOKEN}, bright happy smiling Brazilian Portuguese voice, upbeat light music bed underneath`,
    en: `spoken word radio announcer, cheerful bubbly young female DJ voice speaking, ${SPOKEN}, bright happy smiling American English voice, upbeat light music bed underneath`,
  },
};

// "Jake Box" (two words) is spelled out for the voice -- "Jakebox" sometimes
// comes out mispronounced. Each voice has its own way of putting it.
const VOICE_LINES: Record<RadioVoice, Record<RadioLang, (title: string) => string>> = {
  male: {
    pt: (t) => `Seguimos com a nossa programação na Rádio Jake Box. Agora: ${t}.`,
    en: (t) => `Back to our program on Jake Box Radio. Up next: ${t}.`,
  },
  female: {
    pt: (t) => `Na Rádio Jake Box, a programação continua. Agora: ${t}.`,
    en: (t) => `You're listening to Jake Box Radio. Up next: ${t}.`,
  },
  young: {
    pt: (t) => `Bora continuar a programação da Rádio Jake Box! Agora: ${t}!`,
    en: (t) => `Let's keep it going on Jake Box Radio! Up next: ${t}!`,
  },
  cheerful: {
    pt: (t) => `A Rádio Jake Box não para! Agora, pra você: ${t}!`,
    en: (t) => `Jake Box Radio keeps the music coming! Up next: ${t}!`,
  },
};

export function isRadioVoice(v: unknown): v is RadioVoice {
  return typeof v === "string" && (RADIO_VOICES as readonly string[]).includes(v);
}

/** The voice used least among songs on air, so the station mixes them. */
async function leastUsedVoice(excludeSongId: string): Promise<RadioVoice> {
  const songs = await db.song.findMany({
    where: { radioAt: { not: null }, deletedAt: null, radioIntroKey: { not: null }, NOT: { id: excludeSongId } },
    select: { radioVoice: true },
  });
  // Intros recorded before voices existed are the original male announcer.
  const count = (v: RadioVoice) => songs.filter((s) => (s.radioVoice ?? "male") === v).length;
  return [...RADIO_VOICES].sort((a, b) => count(a) - count(b))[0];
}

/** Same loudness as the songs/jingles (-14 LUFS), short fade at the end so
 * the music bed doesn't cut off abruptly, capped at 20s. */
function finishClip(input: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, [
      "-v", "error", "-threads", "1", "-i", "pipe:0", "-t", "20",
      "-af", "loudnorm=I=-14:TP=-1.5:LRA=11,areverse,afade=t=in:d=1.2,areverse",
      "-ar", "44100", "-f", "mp3", "-b:a", "160k", "pipe:1",
    ]);
    const out: Buffer[] = [];
    proc.stdout.on("data", (c) => out.push(c));
    proc.on("error", reject);
    proc.on("close", (code) => (code === 0 ? resolve(Buffer.concat(out)) : reject(new Error(`ffmpeg exited ${code}`))));
    proc.stdin.end(input);
  });
}

const inFlight = new Set<string>();

/** Generates the announcer intro for a song that's going on air, in the
 * given voice (else the song's current one, else the least used). Best-
 * effort: the song plays without an intro until (or if) this finishes. */
export async function generateRadioIntro(songId: string, voice?: RadioVoice): Promise<void> {
  if (inFlight.has(songId)) return;
  inFlight.add(songId);
  try {
    const song = await db.song.findUnique({
      where: { id: songId },
      include: { generation: { select: { language: true } } },
    });
    if (!song || !song.radioAt || song.radioIntroKey) return;
    const lang: RadioLang = isNational(song.generation.language) ? "pt" : "en";
    const v = voice ?? (isRadioVoice(song.radioVoice) ? song.radioVoice : await leastUsedVoice(song.id));
    const raw = await generateRawSonic({
      title: `Radio intro ${song.id}`,
      tags: VOICE_TAGS[v][lang],
      prompt: `[Spoken]\n${VOICE_LINES[v][lang](song.title)}`,
    });
    const clip = await finishClip(raw);
    // New file name per take, so browsers never replay a cached old intro.
    const key = `radio-intro-${song.id}-${Date.now()}.mp3`;
    await saveSongAudio(key, clip);
    const exact = await exactDurationMs(clip);
    const ms = exact % 1000 === 0 ? exact + 1 : exact; // whole seconds = "unmeasured" (see lib/radio)
    await db.song.update({
      where: { id: song.id },
      data: { radioIntroKey: key, radioIntroMs: ms, radioVoice: v },
    });
    console.log(`Radio intro for "${song.title}" (${v}): ${ms}ms`);
  } catch (err) {
    console.error(`Radio intro for ${songId} failed:`, err);
  } finally {
    inFlight.delete(songId);
  }
}
