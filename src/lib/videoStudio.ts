/** Server-only client for the separate VideoSubtitles Flask app (a local,
 * single-user tool at C:\Projects\Musicas\VideoSubtitles that turns a song
 * into a Whisper-aligned captioned lyric video + auto short clip). Jakebox
 * calls it as an external service over HTTP rather than porting its
 * pipeline in -- see musicProvider.ts's docstring for the same
 * resilience-over-reimplementation philosophy, though this integration has
 * no fallback: if the Flask app isn't running, video features are simply
 * unavailable (surfaced as VideoStudioUnavailableError). Never import this
 * from a client component. */

const BASE_URL = process.env.VIDEO_STUDIO_URL ?? "http://127.0.0.1:5000";

export class VideoStudioUnavailableError extends Error {}
export class VideoStudioError extends Error {}

async function call(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(`${BASE_URL}${path}`, init);
  } catch {
    throw new VideoStudioUnavailableError(
      `Can't reach the Video Studio service at ${BASE_URL} -- is \`python app.py\` running in VideoSubtitles?`,
    );
  }
}

// Flask redirects (302) on success for the form-post routes (upload, short,
// save_links) rather than returning JSON -- `redirect: "manual"` (safe to
// inspect server-side in Node, unlike a browser's opaque-redirect
// restriction) lets us treat "got a redirect" as success without following
// it anywhere.
function assertRedirectedOk(res: Response, action: string) {
  if (res.status < 200 || res.status >= 400) {
    throw new VideoStudioError(`${action} failed (${res.status})`);
  }
}

/** VideoSubtitles derives its own filenames directly from this identifier,
 * so it has to be filesystem-safe and unique -- Jakebox song titles are
 * AI-generated free text and can collide or contain unsafe characters. */
export function studioNameFor(songTitle: string, songId: string): string {
  const slug = songTitle
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${slug || "song"}-${songId.slice(-8)}`;
}

// Jakebox lyrics can carry [Verse]/[Chorus] structure tags and {...}
// non-sung stage-direction cues (see lyrics.ts's TAG_RE) inline. Whisper
// alignment on the VideoSubtitles side only skips [...]-only lines, not
// {...} ones -- stripping both here keeps a stray stage direction from
// getting captioned as if it were sung.
function stripTagLines(lyricsText: string): string {
  return lyricsText
    .split("\n")
    .filter((line) => !/^\s*[[{][^\]}]*[\]}]\s*$/.test(line))
    .join("\n");
}

export async function submitVideoJob(params: {
  name: string;
  displayTitle: string;
  language: "pt" | "en";
  lyricsText: string;
  audio: Buffer;
  audioFilename: string;
  handle?: string;
}): Promise<void> {
  const form = new FormData();
  form.set("title", params.name);
  form.set("display_title", params.displayTitle);
  form.set("handle", params.handle ?? "");
  form.set("language", params.language);
  form.set("lyrics", stripTagLines(params.lyricsText));
  form.set("audio", new Blob([new Uint8Array(params.audio)]), params.audioFilename);

  const res = await call("/upload", { method: "POST", body: form, redirect: "manual" });
  assertRedirectedOk(res, "Video Studio upload");
}

export type VideoStudioStatus = {
  status: "running" | "done" | "error" | "unknown";
  stage: string;
  error: string | null;
  elapsed: number;
  videoUrl?: string;
  durationSeconds?: number;
  promoText?: string;
  shortReady?: boolean;
  shortUrl?: string;
};

export async function getVideoStatus(name: string): Promise<VideoStudioStatus> {
  const res = await call(`/status/${encodeURIComponent(name)}`);
  if (!res.ok) throw new VideoStudioError(`Video Studio status check failed (${res.status})`);
  return res.json();
}

export async function listVideoStudioSongs(): Promise<string[]> {
  const res = await call("/api/songs");
  if (!res.ok) throw new VideoStudioError(`Video Studio songs list failed (${res.status})`);
  const data = (await res.json()) as { songs: string[] };
  return data.songs;
}

export async function cutShort(
  name: string,
  params: { mode: "manual" | "auto"; start?: number; end?: number },
): Promise<void> {
  const form = new FormData();
  form.set("mode", params.mode);
  if (params.mode === "manual") {
    form.set("start", String(params.start ?? 0));
    form.set("end", String(params.end ?? 0));
  }
  const res = await call(`/short/${encodeURIComponent(name)}`, { method: "POST", body: form, redirect: "manual" });
  assertRedirectedOk(res, "Short clip");
}

export async function saveLinks(
  name: string,
  params: { spotifyUrl: string; youtubeUrl: string },
): Promise<void> {
  const form = new FormData();
  form.set("name", name);
  form.set("spotify_url", params.spotifyUrl);
  form.set("youtube_url", params.youtubeUrl);
  const res = await call("/save_links", { method: "POST", body: form, redirect: "manual" });
  assertRedirectedOk(res, "Save links");
}

/** Absolute URL to a rendered video/short -- the browser fetches this
 * directly from the Flask server (same machine, local use), Jakebox's own
 * server never proxies the video bytes. */
export function videoStudioUrl(path: string): string {
  return `${BASE_URL}${path}`;
}
