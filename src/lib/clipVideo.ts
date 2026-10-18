import { randomUUID } from "node:crypto";
import { spawn, execFile } from "node:child_process";
import { writeFile, unlink, readFile } from "node:fs/promises";
import { promisify } from "node:util";
import os from "node:os";
import path from "node:path";
// eslint-disable-next-line @typescript-eslint/no-require-imports -- no types published for this package
const ffmpegPath: string = require("ffmpeg-static");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ffprobePath: string = require("ffprobe-static").path;

const execFileAsync = promisify(execFile);

// Same vertical canvas as video.ts's auto-generated waveform video, so a
// user's own-footage clip and the auto one look like they belong to the
// same product.
const WIDTH = 720;
const HEIGHT = 1280;
const FPS = 30;
const XFADE_SECONDS = 0.5;

export const MIN_CLIPS = 2;
export const MAX_CLIPS = 6;
// A generous per-clip cap, not a target -- keeps one oversized phone
// recording from blowing up render time/disk on a shared instance.
export const MAX_CLIP_BYTES = 200 * 1024 * 1024; // 200MB

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

async function probeDurationSeconds(filePath: string): Promise<number> {
  const { stdout } = await execFileAsync(ffprobePath, [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    filePath,
  ]);
  const seconds = parseFloat(stdout.trim());
  if (!Number.isFinite(seconds)) throw new Error(`Could not read duration of ${filePath}`);
  return seconds;
}

async function normalizeClip(srcPath: string, outPath: string): Promise<void> {
  await run([
    "-y", "-i", srcPath,
    "-vf", `scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,crop=${WIDTH}:${HEIGHT},setsar=1,fps=${FPS}`,
    "-an",
    "-c:v", "libx264", "-crf", "20", "-pix_fmt", "yuv420p",
    outPath,
  ]);
}

/** Crossfades `current` and `next` together into a new file, returning its
 * path -- callers fold a list of clips into one with repeated calls to
 * this, same xfade-chain approach used for the manual DJ-video builds. */
async function xfadeInto(current: string, next: string, outPath: string): Promise<void> {
  const currentDuration = await probeDurationSeconds(current);
  const offset = Math.max(0, currentDuration - XFADE_SECONDS);
  await run([
    "-y", "-i", current, "-i", next,
    "-filter_complex", `[0:v][1:v]xfade=transition=fade:duration=${XFADE_SECONDS}:offset=${offset.toFixed(3)}[vout]`,
    "-map", "[vout]",
    "-c:v", "libx264", "-crf", "20", "-pix_fmt", "yuv420p",
    outPath,
  ]);
}

/** Builds one video from 2-6 user-uploaded clips, normalized to a common
 * canvas and crossfaded together, topped with the given song audio. If the
 * crossfaded clip sequence is shorter than the song it's looped
 * (-stream_loop) to fill the remaining time rather than leaving the song
 * play over a frozen last frame; if longer, it's trimmed to the song's
 * length. Returns the final muxed video and its duration. */
export async function buildClipVideo(params: {
  clips: Buffer[];
  songAudio: Buffer;
  songAudioFormat: string;
}): Promise<{ video: Buffer; durationSeconds: number }> {
  if (params.clips.length < MIN_CLIPS || params.clips.length > MAX_CLIPS) {
    throw new Error(`Expected ${MIN_CLIPS}-${MAX_CLIPS} clips, got ${params.clips.length}`);
  }

  const tmpDir = os.tmpdir();
  const id = randomUUID();
  const cleanup: string[] = [];
  const tmp = (name: string) => {
    const p = path.join(tmpDir, `jakebox-clipvideo-${id}-${name}`);
    cleanup.push(p);
    return p;
  };

  try {
    const audioPath = tmp(`audio.${params.songAudioFormat}`);
    await writeFile(audioPath, params.songAudio);
    const songDuration = await probeDurationSeconds(audioPath);

    const normalizedPaths: string[] = [];
    for (let i = 0; i < params.clips.length; i++) {
      const srcPath = tmp(`src${i}.mp4`);
      await writeFile(srcPath, params.clips[i]);
      const normPath = tmp(`norm${i}.mp4`);
      await normalizeClip(srcPath, normPath);
      normalizedPaths.push(normPath);
    }

    let chainedPath = normalizedPaths[0];
    for (let i = 1; i < normalizedPaths.length; i++) {
      const nextChained = tmp(`chain${i}.mp4`);
      await xfadeInto(chainedPath, normalizedPaths[i], nextChained);
      chainedPath = nextChained;
    }
    const chainedDuration = await probeDurationSeconds(chainedPath);

    const videoPath = tmp("final.mp4");
    if (chainedDuration >= songDuration) {
      await run(["-y", "-i", chainedPath, "-t", songDuration.toFixed(3), "-c", "copy", videoPath]);
    } else {
      // Loop the whole crossfaded sequence to cover the song, then hard-cut
      // to its exact length (-stream_loop alone would overshoot by up to
      // one full loop).
      await run([
        "-y", "-stream_loop", "-1", "-i", chainedPath,
        "-t", songDuration.toFixed(3),
        "-c:v", "libx264", "-crf", "20", "-pix_fmt", "yuv420p",
        videoPath,
      ]);
    }

    const muxedPath = tmp("muxed.mp4");
    await run([
      "-y", "-i", videoPath, "-i", audioPath,
      "-map", "0:v", "-map", "1:a",
      "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
      "-shortest",
      muxedPath,
    ]);

    const video = await readFile(muxedPath);
    return { video, durationSeconds: songDuration };
  } finally {
    await Promise.all(cleanup.map((p) => unlink(p).catch(() => {})));
  }
}
