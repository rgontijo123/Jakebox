/** Derives line-level lyric timing from the ACTUAL rendered audio, since
 * none of Jakebox's active music providers (musicapi/aimusicapi/treblo/
 * mureka) return word-level timestamps -- reuses the Musicas project's
 * proven Whisper + demucs vocal-isolation alignment pipeline (see
 * scripts/force_align.py) rather than reimplementing it. Best-effort: on
 * any failure (Python/demucs/whisper not available, timeout, etc.) returns
 * an empty array so the video still renders, just without synced captions.
 */
import { spawn } from "node:child_process";
import { writeFile, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export type AlignedLine = { text: string; start: number; end: number };

const SCRIPT_PATH = path.join(process.cwd(), "scripts", "force_align.py");

export async function forceAlignLyrics(
  audio: Buffer,
  lyricsText: string,
  language: string,
): Promise<AlignedLine[]> {
  if (!lyricsText.trim()) return [];

  // faster-whisper only accepts bare ISO-639-1 codes ("pt", "en") -- Jakebox's
  // own language values carry a region tag ("pt-BR", "pt-PT") for the UI/
  // providers, which Whisper rejects outright ("not a valid language code").
  const whisperLanguage = language.split("-")[0];

  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "jakebox-align-"));
  const audioPath = path.join(tmpDir, "audio.mp3");
  const lyricsPath = path.join(tmpDir, "lyrics.txt");

  try {
    await writeFile(audioPath, audio);
    await writeFile(lyricsPath, lyricsText, "utf-8");

    const stdout = await new Promise<string>((resolve, reject) => {
      const proc = spawn("python", [SCRIPT_PATH, audioPath, lyricsPath, whisperLanguage]);
      const out: Buffer[] = [];
      const err: Buffer[] = [];
      proc.stdout.on("data", (c: Buffer) => out.push(c));
      proc.stderr.on("data", (c: Buffer) => err.push(c));
      proc.on("error", reject);
      const timeout = setTimeout(() => {
        proc.kill();
        reject(new Error("force_align.py timed out"));
      }, 15 * 60 * 1000); // vocal isolation + whisper on a full song can take several minutes
      proc.on("close", (code) => {
        clearTimeout(timeout);
        if (code === 0) resolve(Buffer.concat(out).toString("utf-8"));
        else reject(new Error(`force_align.py exited ${code}: ${Buffer.concat(err).toString("utf-8").slice(-800)}`));
      });
    });

    return JSON.parse(stdout) as AlignedLine[];
  } catch (err) {
    console.error("forceAlignLyrics failed, rendering without synced captions:", err);
    return [];
  } finally {
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}
