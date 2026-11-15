import { readFile } from "node:fs/promises";
import path from "node:path";
import { PALETTES, LOGO_PATH, pickByHash } from "./video";
import { fetchWithTimeout } from "./fetchWithTimeout";
import { Resvg } from "@resvg/resvg-js";

const FONT_BOLD = path.join(process.cwd(), "public", "fonts", "Lato-Bold.ttf");
const FONT_REGULAR = path.join(process.cwd(), "public", "fonts", "Lato-Regular.ttf");

const SIZE = 720;

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


function escapeXml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Up to `maxLines` lines of roughly `width` characters, last one ellipsized. */
function wrapTitle(title: string, width: number, maxLines: number): string[] {
  const lines: string[] = [];
  let cur = "";
  for (const word of title.trim().split(/\s+/)) {
    if (cur && (cur + " " + word).length > width) {
      lines.push(cur);
      cur = word;
    } else cur = cur ? `${cur} ${word}` : word;
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = `${lines[maxLines - 1].slice(0, width - 1)}…`;
  }
  return lines;
}

/** Last-resort cover: the song's title on its palette gradient (same hash
 * pick as the video, so cover and clip match) with a small Jakebox logo --
 * still recognisably this song, unlike the bare logo it replaces. Pure
 * resvg, no ffmpeg or network involved. */
async function generateTitleCover(params: { title: string; styleSummary: string }): Promise<Buffer> {
  const [c0, c1] = pickByHash(params.title, PALETTES);
  const logo = (await readFile(LOGO_PATH)).toString("base64");
  const lines = wrapTitle(params.title, 16, 3);
  const fontSize = lines.length > 2 ? 64 : 76;
  const lineHeight = fontSize * 1.15;
  const top = SIZE / 2 - (lines.length * lineHeight) / 2 + fontSize * 0.8 + 40;
  const style = escapeXml(params.styleSummary.split(",")[0].trim().slice(0, 34));
  const text = lines
    .map((line, i) =>
      `<text x="${SIZE / 2}" y="${(top + i * lineHeight).toFixed(1)}" font-family="Lato" font-weight="700" font-size="${fontSize}" fill="#FFFFFF" text-anchor="middle">${escapeXml(line)}</text>`,
    )
    .join("");
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${SIZE}" height="${SIZE}">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#${c0}"/><stop offset="1" stop-color="#${c1}"/></linearGradient></defs>` +
    `<rect width="${SIZE}" height="${SIZE}" fill="url(#g)"/>` +
    `<image href="data:image/png;base64,${logo}" x="${SIZE / 2 - 70}" y="60" width="140" height="140"/>` +
    text +
    `<text x="${SIZE / 2}" y="${SIZE - 60}" font-family="Lato" font-size="34" fill="#F5B900" text-anchor="middle">${style}</text>` +
    `</svg>`;
  return Buffer.from(
    new Resvg(svg, {
      font: { fontFiles: [FONT_BOLD, FONT_REGULAR], loadSystemFonts: false, defaultFontFamily: "Lato" },
    })
      .render()
      .asPng(),
  );
}

/** The cover the music provider drew for this song (MusicAPI returns one),
 * downloaded -- null when there's none or it can't be fetched. */
async function downloadProviderCover(url: string | null | undefined): Promise<Buffer | null> {
  if (!url) return null;
  try {
    const res = await fetchWithTimeout(url, {}, 30_000);
    if (res.ok && res.headers.get("content-type")?.startsWith("image/")) return Buffer.from(await res.arrayBuffer());
    console.error("Provider cover download unusable", res.status, res.headers.get("content-type"));
  } catch (err) {
    console.error("Provider cover download failed", err);
  }
  return null;
}

/** Cover art for a song, best option first: an AI image matching its
 * title/style, else the cover the music provider made for it, else (only
 * when `allowTitleCover`) a title-on-gradient cover. Previously the generic
 * fallback lived inside the AI step, so with OpenAI out of credits every
 * song got a bare logo and the provider's own cover was never used. */
export async function generateCoverArt(params: {
  title: string;
  styleSummary: string;
  providerCoverUrl?: string | null;
  allowTitleCover?: boolean;
}): Promise<Buffer | null> {
  const aiCover = await generateAiCoverArt(params);
  if (aiCover) return aiCover;
  const providerCover = await downloadProviderCover(params.providerCoverUrl);
  if (providerCover) return providerCover;
  if (params.allowTitleCover === false) return null;
  try {
    return await generateTitleCover(params);
  } catch (err) {
    console.error("Title cover generation failed", err);
    return null;
  }
}
