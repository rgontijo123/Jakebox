import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { unlink, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { PALETTES, LOGO_PATH, pickByHash } from "./video";
import { fetchWithTimeout } from "./fetchWithTimeout";
// eslint-disable-next-line @typescript-eslint/no-require-imports -- no types published for this package
const ffmpegPath: string = require("ffmpeg-static");

const SIZE = 720;
const LOGO_SIZE = 280;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/** Real AI cover art via OpenAI's image model, using the key already
 * configured for moderation. "low" quality keeps this to ~$0.01/image --
 * plenty for a small library-card thumbnail. Returns null on any failure
 * (missing key, content-policy rejection, timeout, quota) so the caller
 * falls back to the branded gradient below; never worth failing the
 * generation itself over. */
async function generateAiCoverArt(params: { title: string; styleSummary: string }): Promise<Buffer | null> {
  if (!OPENAI_API_KEY) return null;

  const prompt =
    `Album cover art for a song titled "${params.title}". Musical style and mood: ${params.styleSummary}. ` +
    "Square format, vibrant, professional album artwork. No text, letters, or words anywhere in the image.";

  try {
    const res = await fetchWithTimeout(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt,
          size: "1024x1024",
          quality: "low",
          output_format: "jpeg",
          n: 1,
        }),
      },
      45_000,
    );

    if (!res.ok) {
      console.error("OpenAI cover art request failed", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) return null;
    return Buffer.from(b64, "base64");
  } catch (err) {
    console.error("OpenAI cover art request failed", err);
    return null;
  }
}

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

/** Cover art for a generated song: tries a real AI image matching the
 * song's title/style first (generateAiCoverArt, above), and falls back to
 * a branded gradient (same palette set and per-song hash pick as the
 * waveform video, so a song's video and cover agree visually) with the
 * Jakebox logo centered when the AI call fails for any reason (no key,
 * quota, content-policy rejection, timeout). The gradient path is pure
 * ffmpeg, so it only fails if ffmpeg itself errors -- callers treat a null
 * result here as "fall back to the video still-frame" instead. */
export async function generateCoverArt(params: { title: string; styleSummary: string }): Promise<Buffer | null> {
  const aiCover = await generateAiCoverArt(params);
  if (aiCover) return aiCover;

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
