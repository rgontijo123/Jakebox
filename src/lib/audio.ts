import { randomUUID } from "node:crypto";
import { execFile, spawn } from "node:child_process";
import { unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { parseBuffer } from "music-metadata";
// eslint-disable-next-line @typescript-eslint/no-require-imports -- no types published for these packages
const ffprobePath: string = require("ffprobe-static").path;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ffmpegPath: string = require("ffmpeg-static");

const execFileAsync = promisify(execFile);

const MIME_TYPES: Record<string, string> = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
};

// Some Ogg/Opus streams (observed from the Treblo API) don't carry a
// duration/bitrate in their headers, so music-metadata's header-only parse
// reports it as undefined even though the audio plays back fine end to end.
// Fall back to ffprobe, which gets an accurate duration by actually decoding
// the stream, for whatever format/provider hits this.
async function ffprobeDurationSeconds(buffer: Buffer): Promise<number | undefined> {
  const tmpPath = path.join(os.tmpdir(), `jakebox-audio-${randomUUID()}`);
  await writeFile(tmpPath, buffer);
  try {
    const { stdout } = await execFileAsync(ffprobePath, [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      tmpPath,
    ]);
    const seconds = parseFloat(stdout.trim());
    return Number.isFinite(seconds) ? seconds : undefined;
  } finally {
    await unlink(tmpPath).catch(() => {});
  }
}

export async function getAudioDurationSeconds(buffer: Buffer, format = "mp3"): Promise<number> {
  const metadata = await parseBuffer(buffer, MIME_TYPES[format] ?? "audio/mpeg").catch(() => null);
  if (metadata?.format.duration) {
    return Math.round(metadata.format.duration);
  }
  const fallback = await ffprobeDurationSeconds(buffer);
  return Math.round(fallback ?? 0);
}

/** Transcodes any ffmpeg-readable audio buffer to mp3. Used to normalize
 * provider output (e.g. Treblo's Ogg/Opus) to the one format every client
 * (including Safari/iOS, which doesn't reliably play Ogg+Opus) is guaranteed
 * to support. */
export function transcodeToMp3(input: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, ["-i", "pipe:0", "-f", "mp3", "-codec:a", "libmp3lame", "-b:a", "192k", "pipe:1"]);
    const chunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    proc.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    proc.stderr.on("data", (chunk: Buffer) => stderrChunks.push(chunk));
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) {
        resolve(Buffer.concat(chunks));
      } else {
        reject(new Error(`ffmpeg exited with code ${code}: ${Buffer.concat(stderrChunks).toString("utf-8").slice(-500)}`));
      }
    });
    proc.stdin.write(input);
    proc.stdin.end();
  });
}
