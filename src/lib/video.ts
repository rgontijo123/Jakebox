import { randomUUID, createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { writeFile, unlink, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { alignLyrics, type WordTimestamp } from "./lyrics";
import { getAudioDurationSeconds } from "./audio";
import { forceAlignLyrics, type AlignedLine } from "./forceAlign";
import { existsSync } from "node:fs";
// eslint-disable-next-line @typescript-eslint/no-require-imports -- no types published for this package
const ffmpegPath: string = require("ffmpeg-static");

const WIDTH = 720;
const HEIGHT = 1280; // 9:16, vertical -- matches Reels/Stories/TikTok
// 512x512 with alpha (confirmed via ffprobe) -- safe to scale uniformly
// without distortion or a white box behind it. The SVG counterpart
// (public/branding/jake-logo.svg) can't be fed to ffmpeg directly:
// ffmpeg-static isn't built with librsvg support.
const LOGO_PATH = path.join(process.cwd(), "public", "icons", "icon-512.png");
const LOGO_SIZE = 150;
// Top of the branding block (logo + "Made with Jakebox"). Placed above the
// title/subtitle/author card, rather than at the bottom, so it stays fully
// visible for the whole video without fighting the lyric captions -- which
// live near the bottom of the frame -- for the same space.
const LOGO_Y = 50;
const BRAND_TEXT_Y = LOGO_Y + LOGO_SIZE + 12;
const TITLE_Y = BRAND_TEXT_Y + 44;
// The drive-letter colon needs escaping even inside a single-quoted filter
// option value -- fontfile parsing treats it specially regardless of the
// surrounding quotes (confirmed by trial: unescaped, it silently falls back
// to a default font instead of erroring).
const FONT_BOLD = "C\\:/Windows/Fonts/arialbd.ttf";
const FONT_REGULAR = "C\\:/Windows/Fonts/arial.ttf";

// Real drone footage (seamless boomerang loops built for the Musicas
// megamix project -- copied locally under backgrounds/drone/, gitignored:
// large binaries, not meant to be committed) as the video background,
// picked deterministically from the song title so the same song always
// renders the same look. Falls back to an animated two-color gradient
// (same technique as VideoSubtitles' make_video.py) if that folder isn't
// present -- e.g. a fresh clone that hasn't fetched the clips yet.
const DRONE_DIR = path.join(process.cwd(), "backgrounds", "drone");
const DRONE_CLIPS = ["boomerang_forest_river.mp4", "boomerang_lake_mountains.mp4", "boomerang_beach_ocean.mp4", "boomerang_misty_park.mp4"];

const PALETTES: [string, string][] = [
  ["2b1055", "7597de"],
  ["0f0c29", "302b63"],
  ["1a2980", "26d0ce"],
  ["3a1c71", "d76d77"],
  ["232526", "414345"],
  ["134e5e", "71b280"],
  ["0f2027", "203a43"],
  ["4b134f", "c94b4b"],
];

function pickByHash<T>(name: string, options: T[]): T {
  const digest = createHash("sha256").update(name).digest("hex");
  const idx = parseInt(digest.slice(0, 8), 16) % options.length;
  return options[idx];
}

// Best-effort thematic match: score each clip's keywords against the song's
// own lyrics/style text and use whichever clip scores highest, so e.g. a
// song about a highway gets road footage instead of whatever the title hash
// happened to land on. Falls back to pickByHash (its previous, only,
// behavior) when nothing matches -- title-only variety beats no picture at
// all for songs with no nature/setting words in them.
const DRONE_KEYWORDS: Record<string, string[]> = {
  "boomerang_beach_ocean.mp4": ["praia", "mar", "oceano", "onda", "ondas", "areia", "litoral", "costa", "maresia", "verao"],
  "boomerang_forest_river.mp4": ["rio", "floresta", "mata", "riacho", "correnteza", "reflexo", "cachoeira"],
  "boomerang_lake_mountains.mp4": ["lago", "montanha", "montanhas", "serra", "pico", "vale", "cordilheira"],
  "boomerang_misty_park.mp4": ["parque", "neblina", "nevoeiro", "manha", "amanhecer", "jardim", "trilha"],
};

// Built from char codes rather than a literal regex range -- a literal
// combining-mark range in source is indistinguishable from the mark it
// describes once it hits any editor/terminal that renders combining
// characters, which makes it unreadable and easy to silently corrupt.
const DIACRITIC_MARKS = new RegExp(`[${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036f)}]`, "g");

function stripAccents(text: string): string {
  return text.normalize("NFD").replace(DIACRITIC_MARKS, "").toLowerCase();
}

function pickDroneClipByKeywords(text: string): string | null {
  const normalized = stripAccents(text);
  let best: string | null = null;
  let bestScore = 0;
  for (const [clip, keywords] of Object.entries(DRONE_KEYWORDS)) {
    const score = keywords.filter((kw) => normalized.includes(kw)).length;
    if (score > bestScore) {
      best = clip;
      bestScore = score;
    }
  }
  return best;
}

/** Escapes text for safe use inside a single-quoted ffmpeg drawtext filter
 * argument (text='...'). Everything inside single quotes is literal to
 * ffmpeg's filtergraph parser except the quote character itself, which
 * can't be escaped within the quotes at all -- swap it for a visually close
 * character instead of trying to reconstruct the quote-break-quote trick. */
function escapeDrawtext(text: string): string {
  return text.replace(/'/g, "\u2019");
}

function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}...` : trimmed;
}

// drawtext has no auto-fit -- a fixed font size overflows the 720px frame
// once the title/style text runs long (confirmed visually: at fontsize 52,
// anything past ~18 characters of Arial Bold already runs past the edges).
// Scales the font down for longer text instead, rather than relying on
// truncation length alone to keep it on-frame.
function fitFontSize(text: string, maxWidthPx: number, avgCharWidthRatio: number, maxSize: number, minSize: number): number {
  if (!text) return maxSize;
  const fitted = Math.floor(maxWidthPx / (text.length * avgCharWidthRatio));
  return Math.max(minSize, Math.min(maxSize, fitted));
}

// Same colon-escaping issue as FONT_BOLD/FONT_REGULAR above -- any absolute
// Windows path handed to a ffmpeg filter option needs its drive-letter colon
// escaped and backslashes normalized to forward slashes, or libass's option
// parser mis-splits it.
function toFilterPath(p: string): string {
  return p.replace(/\\/g, "/").replace(/:/g, "\\:");
}

function formatAssTimestamp(ms: number): string {
  const cs = Math.round(ms / 10);
  const centiseconds = cs % 100;
  const totalSeconds = Math.floor(cs / 100);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
}

// ASS Dialogue text treats { and } as the start of an override tag block --
// swap them out rather than trying to escape them, since there's no escape
// sequence for a literal brace inside the format.
function escapeAssText(text: string): string {
  return text.replace(/\\/g, "⁄").replace(/[{}]/g, (c) => (c === "{" ? "(" : ")"));
}

/** Builds a "natural sentence" lyric-video subtitle track: one on-screen
 * cue per written lyric line (already a natural 4-8 word phrase, no
 * rechunking needed), timed from that line's first sung word to its last,
 * using the same word timestamps the in-app player already highlights
 * word-by-word with (see lyrics.ts). Section tags ([Verse], [Chorus]) never
 * carry timestamps and are skipped, as is any line ElevenLabs didn't return
 * timestamps for (alignment can drift and run out on a long song -- see
 * alignLyrics) rather than showing it mistimed. Returns null when there's
 * nothing timed to show (instrumental, or timestamps missing entirely). */
function buildLyricsAss(lyricsText: string, timestamps: WordTimestamp[]): string | null {
  const cues = alignLyrics(lyricsText, timestamps)
    .filter((line) => !line.isTag)
    .map((line) => {
      const timedWords = line.words.filter(
        (w): w is { text: string; startMs: number; endMs: number } => w.startMs !== null && w.endMs !== null,
      );
      if (!timedWords.length) return null;
      return {
        start: timedWords[0].startMs,
        end: timedWords[timedWords.length - 1].endMs,
        text: escapeAssText(line.text),
      };
    })
    .filter((cue): cue is { start: number; end: number; text: string } => cue !== null);

  if (!cues.length) return null;

  const header = [
    "[Script Info]",
    "ScriptType: v4.00+",
    `PlayResX: ${WIDTH}`,
    `PlayResY: ${HEIGHT}`,
    "ScaledBorderAndShadow: yes",
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    // Natural-sentence style: readable sentence-case phrases, opaque box
    // (BorderStyle 3) rather than just an outline, since these sit over an
    // audio-reactive waveform (see the [wave] overlay below) that would
    // otherwise cut through a plain outline.
    "Style: Lyrics,Arial,40,&H00FFFFFF,&H000000FF,&H00000000,&H90000000,1,0,0,0,100,100,0,0,3,0,0,2,60,60,80,1",
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
  ].join("\n");

  const body = cues
    .map((cue) => `Dialogue: 0,${formatAssTimestamp(cue.start)},${formatAssTimestamp(cue.end)},Lyrics,,0,0,0,,${cue.text}`)
    .join("\n");

  return `${header}\n${body}\n`;
}

/** Builds captions directly from line-level {text, start, end} entries
 * (seconds) -- the output of forceAlignLyrics, matching what
 * VideoSubtitles' own make_video.py burns in, rather than the word-level
 * highlighting buildLyricsAss above does (kept for the day some provider
 * actually returns word timestamps). */
function buildLyricsAssFromLines(lines: AlignedLine[]): string | null {
  if (!lines.length) return null;

  const header = [
    "[Script Info]",
    "ScriptType: v4.00+",
    `PlayResX: ${WIDTH}`,
    `PlayResY: ${HEIGHT}`,
    "ScaledBorderAndShadow: yes",
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    "Style: Lyrics,Arial,40,&H00FFFFFF,&H000000FF,&H00000000,&H90000000,1,0,0,0,100,100,0,0,3,0,0,2,60,60,80,1",
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
  ].join("\n");

  const body = lines
    .map(
      (line) =>
        `Dialogue: 0,${formatAssTimestamp(line.start * 1000)},${formatAssTimestamp(line.end * 1000)},Lyrics,,0,0,0,,${escapeAssText(line.text)}`,
    )
    .join("\n");

  return `${header}\n${body}\n`;
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

/** Renders a fully-automatic vertical video for a finished song: a dark
 * background, the song title and style as text, a gold audio-reactive
 * waveform generated straight from the actual audio (no stock
 * footage/images involved -- nothing to license, nothing to pick per song,
 * works identically for any genre or user), and, when word timestamps are
 * available, sentence-level lyric captions burned in and synced to the
 * vocals (see buildLyricsAss above). */
export async function generateSongVideo(params: {
  audio: Buffer;
  title: string;
  styleSummary: string;
  authorName: string;
  language?: string;
  lyricsText?: string;
  wordTimestamps?: WordTimestamp[];
  // Manual override for the background drone clip's filename (must be one
  // of DRONE_CLIPS) -- skips both the keyword match and the hash pick.
  backgroundClip?: string;
}): Promise<{ video: Buffer; thumbnail: Buffer }> {
  const tmpDir = os.tmpdir();
  const id = randomUUID();
  const audioPath = path.join(tmpDir, `jakebox-video-audio-${id}.mp3`);
  const videoPath = path.join(tmpDir, `jakebox-video-out-${id}.mp4`);
  const assPath = path.join(tmpDir, `jakebox-video-lyrics-${id}.ass`);

  await writeFile(audioPath, params.audio);

  const title = escapeDrawtext(truncate(params.title, 40));
  const subtitle = escapeDrawtext(truncate(params.styleSummary, 46));
  const authorText = escapeDrawtext(`by ${params.authorName}`);
  const titleMargin = 40;
  const titleFontSize = fitFontSize(title, WIDTH - titleMargin, 0.62, 52, 26);
  const subtitleFontSize = fitFontSize(subtitle, WIDTH - titleMargin, 0.55, 32, 18);
  const authorFontSize = fitFontSize(authorText, WIDTH - titleMargin, 0.5, 26, 16);
  const durationSeconds = await getAudioDurationSeconds(params.audio, "mp3");

  // Prefer real word-level timestamps if a provider ever returns them;
  // otherwise derive line-level timing ourselves from the actual rendered
  // audio (see forceAlign.ts) -- best-effort, so a failure here still
  // yields a video, just without synced captions.
  let assContent: string | null = null;
  if (params.lyricsText && params.wordTimestamps?.length) {
    assContent = buildLyricsAss(params.lyricsText, params.wordTimestamps);
  } else if (params.lyricsText?.trim()) {
    const lines = await forceAlignLyrics(params.audio, params.lyricsText, params.language ?? "en");
    assContent = buildLyricsAssFromLines(lines);
  }
  if (assContent) await writeFile(assPath, assContent, "utf-8");

  const matchText = `${params.lyricsText ?? ""} ${params.styleSummary}`;
  const droneFilename =
    params.backgroundClip ?? pickDroneClipByKeywords(matchText) ?? pickByHash(params.title, DRONE_CLIPS);
  const droneClip = path.join(DRONE_DIR, droneFilename);
  const useDrone = existsSync(droneClip);
  const [c0, c1] = pickByHash(params.title, PALETTES);

  const backgroundFilter = useDrone
    ? `[0:v]crop=ih*${WIDTH}/${HEIGHT}:ih,scale=${WIDTH}:${HEIGHT},format=yuv420p[bgraw]`
    : `[0:v]format=yuv420p[bgraw]`;

  const subtitleY = TITLE_Y + 70;
  const authorY = subtitleY + subtitleFontSize + 10;

  const filterComplex = [
    backgroundFilter,
    // Branding card: the logo (already square with alpha, scaled uniformly
    // -- no distortion) plus "Made with Jakebox" underneath, at the very
    // top of the frame, visible for the entire video (not just the final
    // seconds) per explicit request for stronger, persistent branding.
    `[2:v]scale=${LOGO_SIZE}:${LOGO_SIZE}[logo]`,
    `[bgraw][logo]overlay=x=(W-w)/2:y=${LOGO_Y}[vlogo]`,
    `[vlogo]drawtext=fontfile='${FONT_BOLD}':text='Made with Jakebox':fontcolor=white:fontsize=30:x=(w-text_w)/2:y=${BRAND_TEXT_Y},` +
      `drawtext=fontfile='${FONT_BOLD}':text='${title}':fontcolor=white:fontsize=${titleFontSize}:x=(w-text_w)/2:y=${TITLE_Y},` +
      `drawtext=fontfile='${FONT_REGULAR}':text='${subtitle}':fontcolor=0xF5B900:fontsize=${subtitleFontSize}:x=(w-text_w)/2:y=${subtitleY},` +
      `drawtext=fontfile='${FONT_REGULAR}':text='${authorText}':fontcolor=0xCCCCCC:fontsize=${authorFontSize}:x=(w-text_w)/2:y=${authorY}[vbase]`,
    // Subtitles are always applied to the fully-composited [vbase] rather
    // than mixed in earlier, otherwise the title/author overlay above
    // would paint over the captions instead of under them.
    ...(assContent ? [`[vbase]subtitles=filename='${toFilterPath(assPath)}'[vsubbed]`] : []),
    `[${assContent ? "vsubbed" : "vbase"}]null[v]`,
  ].join(";");

  const backgroundInput = useDrone
    ? ["-stream_loop", "-1", "-i", droneClip]
    : ["-f", "lavfi", "-i", `gradients=size=${WIDTH}x${HEIGHT}:duration=${durationSeconds.toFixed(3)}:c0=0x${c0}:c1=0x${c1}:x0=0:y0=0:x1=0:y1=${HEIGHT}:speed=0.02`];

  await run([
    "-y",
    ...backgroundInput,
    "-i",
    audioPath,
    "-i",
    LOGO_PATH,
    "-filter_complex",
    filterComplex,
    "-map",
    "[v]",
    "-map",
    "1:a",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-shortest",
    videoPath,
  ]);

  const video = await readFile(videoPath);

  // Cover thumbnail for the library list -- a still frame from the video
  // itself (title/style/author card already visible by 2s in), rather than
  // a separate image-generation step Jakebox doesn't have.
  const thumbnailPath = path.join(tmpDir, `jakebox-video-thumb-${id}.jpg`);
  const thumbnailAt = Math.min(2, Math.max(0, durationSeconds - 0.1));
  await run(["-y", "-ss", thumbnailAt.toFixed(2), "-i", videoPath, "-frames:v", "1", "-update", "1", thumbnailPath]);
  const thumbnail = await readFile(thumbnailPath);

  await unlink(audioPath).catch(() => {});
  await unlink(videoPath).catch(() => {});
  await unlink(thumbnailPath).catch(() => {});
  if (assContent) await unlink(assPath).catch(() => {});

  return { video, thumbnail };
}
