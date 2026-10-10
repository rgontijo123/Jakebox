import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { unlink, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { PALETTES, LOGO_PATH, pickByHash } from "./video";
// eslint-disable-next-line @typescript-eslint/no-require-imports -- no types published for this package
const ffmpegPath: string = require("ffmpeg-static");

const SIZE = 720;
const LOGO_SIZE = 280;

function run(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, args);
    const stderrChunks: Buffer[] = [];
    proc.stderr.on("data", (chunk: Buffer) => stderrChunks.push(chunk));
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}: ${Buffer.concat(stderrChunks).toString("utf-8").slice(-800)}`));
    });
  });
}

/** Branded square cover: a gradient background (same palette set and
 * per-song hash pick as the waveform video, so a song's video and cover
 * agree visually) with the Jakebox logo centered. No per-song AI image --
 * Gemini's image model turned out to require Google Cloud billing even on
 * a "free tier" API key (confirmed: 429 RESOURCE_EXHAUSTED, limit 0), which
 * isn't worth it before Jakebox has any paying users. Pure ffmpeg, so this
 * never fails for quota/cost reasons -- only returns null if ffmpeg itself
 * errors, which callers treat as "fall back to the video still-frame". */
export async function generateCoverArt(params: { title: string; styleSummary: string }): Promise<Buffer | null> {
  const tmpDir = os.tmpdir();
  const id = randomUUID();
  const outPath = path.join(tmpDir, `jakebox-cover-${id}.jpg`);

  const [c0, c1] = pickByHash(params.title, PALETTES);

  try {
    await run([
      "-y",
      "-f",
      "lavfi",
      "-i",
      `gradients=size=${SIZE}x${SIZE}:duration=1:c0=0x${c0}:c1=0x${c1}:x0=0:y0=0:x1=${SIZE}:y1=${SIZE}:speed=0.02`,
      "-i",
      LOGO_PATH,
      "-filter_complex",
      `[1:v]scale=${LOGO_SIZE}:${LOGO_SIZE}[logo];[0:v][logo]overlay=(W-w)/2:(H-h)/2[v]`,
      "-map",
      "[v]",
      "-frames:v",
      "1",
      "-q:v",
      "3",
      outPath,
    ]);
    return await readFile(outPath);
  } catch (err) {
    console.error("Cover art generation failed", err);
    return null;
  } finally {
    await unlink(outPath).catch(() => {});
  }
}
