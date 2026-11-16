import { spawn } from "node:child_process";
import { db } from "@/lib/db";
import { generateRawSonic } from "@/lib/musicapi";
import { exactDurationMs } from "@/lib/exactDuration";
import { saveSongAudio } from "@/lib/storage";
import { isNational } from "@/lib/radio";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ffmpegPath: string = require("ffmpeg-static");

const ANNOUNCER = {
  pt: {
    tags: "spoken word radio announcer, male radio DJ voice speaking, talking not singing, warm deep Brazilian Portuguese voice, soft light instrumental music bed underneath, radio station intro, no singing, no melody in the vocals",
    text: (title: string) =>
      `[Spoken]\nSeguimos com a nossa programação na Rádio Jake Box. Agora: ${title}.`,
  },
  en: {
    tags: "spoken word radio announcer, male radio DJ voice speaking, talking not singing, warm deep American English voice, soft light instrumental music bed underneath, radio station intro, no singing, no melody in the vocals",
    text: (title: string) =>
      `[Spoken]\nBack to our program on Jake Box Radio. Up next: ${title}.`,
  },
};

/** Same loudness as the songs/jingles (-14 LUFS), short fade at the end so
 * the music bed doesn't cut off abruptly, capped at 20s. */
function finishClip(input: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, [
      "-v",
      "error",
      "-threads",
      "1",
      "-i",
      "pipe:0",
      "-t",
      "20",
      "-af",
      "loudnorm=I=-14:TP=-1.5:LRA=11,areverse,afade=t=in:d=1.2,areverse",
      "-ar",
      "44100",
      "-f",
      "mp3",
      "-b:a",
      "160k",
      "pipe:1",
    ]);
    const out: Buffer[] = [];
    proc.stdout.on("data", (c) => out.push(c));
    proc.on("error", reject);
    proc.on("close", (code) =>
      code === 0
        ? resolve(Buffer.concat(out))
        : reject(new Error(`ffmpeg exited ${code}`)),
    );
    proc.stdin.end(input);
  });
}

const inFlight = new Set<string>();

// "Jake Box" (two words) is spelled out for the voice -- "Jakebox" sometimes
// comes out mispronounced.

/** Generates the announcer intro for a song that's going on air. Best-effort:
 * the song plays without an intro until (or if) this finishes. */
export async function generateRadioIntro(songId: string): Promise<void> {
  if (inFlight.has(songId)) return;
  inFlight.add(songId);
  try {
    const song = await db.song.findUnique({
      where: { id: songId },
      include: { generation: { select: { language: true } } },
    });
    if (!song || !song.radioAt || song.radioIntroKey) return;
    const a = isNational(song.generation.language)
      ? ANNOUNCER.pt
      : ANNOUNCER.en;
    const raw = await generateRawSonic({
      title: `Radio intro ${song.id}`,
      tags: a.tags,
      prompt: a.text(song.title),
    });
    const clip = await finishClip(raw);
    const key = `radio-intro-${song.id}.mp3`;
    await saveSongAudio(key, clip);
    const exact = await exactDurationMs(clip);
    const ms = exact % 1000 === 0 ? exact + 1 : exact; // whole seconds = "unmeasured" (see lib/radio)
    await db.song.update({
      where: { id: song.id },
      data: { radioIntroKey: key, radioIntroMs: ms },
    });
    console.log(`Radio intro for "${song.title}": ${ms}ms`);
  } catch (err) {
    console.error(`Radio intro for ${songId} failed:`, err);
  } finally {
    inFlight.delete(songId);
  }
}
