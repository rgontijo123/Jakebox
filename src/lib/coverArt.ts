import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { writeFile, unlink, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
// eslint-disable-next-line @typescript-eslint/no-require-imports -- no types published for this package
const ffmpegPath: string = require("ffmpeg-static");

// "Nano Banana" -- Google's image-generation Gemini variant, same
// GEMINI_API_KEY already configured for Jakebox's free Google AI Studio tier.
const MODEL = "gemini-2.5-flash-image";

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

// Gemini returns PNG -- the thumbnail route serves everything as
// image/jpeg (see api/songs/[id]/thumbnail/route.ts), and center-cropping
// to a perfect square here means the frontend never has to deal with
// whatever aspect ratio the model actually honored.
async function toSquareJpeg(pngBuffer: Buffer): Promise<Buffer> {
  const tmpDir = os.tmpdir();
  const id = randomUUID();
  const inPath = path.join(tmpDir, `jakebox-cover-in-${id}.png`);
  const outPath = path.join(tmpDir, `jakebox-cover-out-${id}.jpg`);
  await writeFile(inPath, pngBuffer);
  try {
    await run([
      "-y",
      "-i",
      inPath,
      "-vf",
      "scale=720:720:force_original_aspect_ratio=increase,crop=720:720",
      "-q:v",
      "3",
      outPath,
    ]);
    return await readFile(outPath);
  } finally {
    await unlink(inPath).catch(() => {});
    await unlink(outPath).catch(() => {});
  }
}

/** AI-generated album cover matching the song's style -- best-effort, same
 * as the video generation step: returns null (never throws) on any failure,
 * including GEMINI_API_KEY not being set, so a finished song is never held
 * up or failed over cover art. Callers fall back to the waveform-video
 * still-frame thumbnail when this returns null. */
export async function generateCoverArt(params: { title: string; styleSummary: string }): Promise<Buffer | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const prompt =
    `Album cover artwork for a song titled "${params.title}", musical style: ${params.styleSummary}. ` +
    "A striking, professional album cover illustration/photo capturing the mood and genre. " +
    "No text, no words, no letters, no typography anywhere in the image.";

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ["IMAGE"],
            imageConfig: { aspectRatio: "1:1" },
          },
        }),
      },
    );

    if (!res.ok) {
      console.error("Gemini cover art request failed", res.status, await res.text().catch(() => ""));
      return null;
    }

    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p: { inlineData?: { data?: string } }) => p.inlineData?.data);
    if (!imagePart) {
      console.error("Gemini cover art response had no image part", JSON.stringify(data).slice(0, 500));
      return null;
    }

    const pngBuffer = Buffer.from(imagePart.inlineData.data as string, "base64");
    return await toSquareJpeg(pngBuffer);
  } catch (err) {
    console.error("Cover art generation failed", err);
    return null;
  }
}
