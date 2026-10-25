/** Server-only wrapper around MusicAPI.ai's Sonic endpoint (api.musicapi.ai)
 * -- a third-party service, NOT an official Suno/Udio API (neither publishes
 * one). Sonic markets itself as "Suno-compatible"; the "running"-state audio
 * URL it hands back mid-generation actually points at sunodownload.ai,
 * suggesting this really does proxy Suno itself rather than an imitation --
 * unconfirmed further than that, and long-term availability is still
 * unproven. Never import this from a client component -- the API key must
 * stay server-side.
 *
 * Response shape confirmed against a live generation (2026-09-12):
 *   POST /api/v1/sonic/create body { custom_mode, mv, title, tags, prompt }
 *   -> { code, message, task_id }. In custom_mode:true, `prompt` holds the
 *   actual lyrics (not a description) and `tags` holds style/genre; `title`
 *   is a required INPUT (unlike the other providers, which only return a
 *   title as output).
 *
 *   Poll GET /api/v1/sonic/task/{task_id}. Before either song is ready this
 *   returns HTTP 202 with { type: "not_ready", error: "..." } -- not an
 *   error, just "keep polling". Once ready: HTTP 200 with
 *   { code, message, data: [song, song] } -- generation always comes back as
 *   a PAIR, and the two songs finish independently (one row can already be
 *   "succeeded" while the other is still "running"). Each song row:
 *   { clip_id, state, title, tags, lyrics, audio_url, duration (a numeric
 *   string, e.g. "17.04"), image_url, video_url, mv, ... }. We use whichever
 *   song reaches "succeeded" first and ignore the other -- Jakebox already
 *   has its own versions/A-B mechanism at a level above this.
 *
 * GUESSED (unconfirmed):
 *   - Instrumental tracks: no instrumental flag surfaced in the create
 *     request even in custom_mode -- routed through custom_mode:false +
 *     `gpt_description_prompt` describing an instrumental track instead.
 *   - Failure state string (guessed "failed"/"error"; only "running" and
 *     "succeeded" confirmed so far).
 *   - "Aligned lyrics" is listed as a Sonic capability but never appeared in
 *     this response -- may be a separate endpoint. Until confirmed, returns
 *     wordTimestamps: []. */

import { MusicGenerationError, type GenerateMusicParams, type GenerateMusicResult } from "@/lib/musicProviderTypes";
import { transcodeToMp3 } from "@/lib/audio";
import { deriveFallbackTitle } from "@/lib/lyrics";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";

export type { GenerateMusicParams, GenerateMusicResult } from "@/lib/musicProviderTypes";

const MUSICAPI_KEY = process.env.MUSICAPI_KEY;
const BASE_URL = "https://api.musicapi.ai";
const MODEL_VERSION = "sonic-v5-5";

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  "pt-BR": "Brazilian Portuguese (pt-BR)",
  "pt-PT": "European Portuguese (pt-PT)",
  es: "Spanish",
  de: "German",
  ja: "Japanese",
};

export class MusicApiError extends MusicGenerationError {}

// Same vocal/pacing/instrument hints already proven necessary for
// ElevenLabs, Treblo, and Mureka.
const VOCAL_HINT =
  "melodic sung vocals with a clear musical melody, not spoken word, not rap, not monotone narration";
const PACING_HINT =
  "natural, unhurried vocal pacing, not rushed -- a brief pause after every comma, and a clear breathing pause at the end of every line";
const INSTRUMENT_HINT =
  "full instrumental arrangement (drums, bass, and other instruments as fits the genre) playing continuously under the vocals";

function buildTags(params: GenerateMusicParams): string {
  const languageName = LANGUAGE_NAMES[params.language] ?? params.language;
  const needsLanguageHint = !params.instrumental && languageName !== "English";
  const languagePrefix = needsLanguageHint ? `[${languageName} vocals, native accent] ` : "";
  if (params.instrumental) return params.stylePrompt;
  return `${languagePrefix}${params.stylePrompt}. ${VOCAL_HINT}. ${PACING_HINT}. ${INSTRUMENT_HINT}.`;
}

// Same rationale as treblo.ts/mureka.ts: [Verse]/[Chorus] structure markers
// and {...} non-sung stage-direction cues are this app's display-side
// convention -- strip before sending so cue text can't get literally sung.
function stripStageDirections(lyricsText: string): string {
  return lyricsText
    .split("\n")
    .filter((line) => !/^\s*[[{][^\]}]*[\]}]\s*$/.test(line))
    .join("\n");
}

type SonicSong = { audio_url?: string; title?: string; state?: string; duration?: string };
type SonicTask = { data?: SonicSong[]; error?: string; type?: string };

const TERMINAL_FAILURE = /fail|error|reject|cancel/i;

async function pollUntilDone(taskId: string, headers: Record<string, string>): Promise<SonicSong> {
  const maxAttempts = 60; // ~5 min at 5s intervals
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let res: Response;
    try {
      res = await fetchWithTimeout(`${BASE_URL}/api/v1/sonic/task/${taskId}`, { headers });
    } catch {
      // a hung connection shouldn't burn the whole attempt budget on one
      // stuck request -- count it as a failed attempt and keep polling
      await new Promise((r) => setTimeout(r, 5000));
      continue;
    }
    // 202 { type: "not_ready" } before either song exists yet -- not an
    // error, just keep polling.
    if (res.status !== 202 && !res.ok) {
      const body = await res.json().catch(() => null);
      throw new MusicApiError(body?.error ?? `MusicAPI status check failed (${res.status})`, res.status);
    }
    if (res.ok) {
      const data = (await res.json()) as SonicTask;
      const songs = data.data ?? [];
      const failed = songs.find((s) => TERMINAL_FAILURE.test(s.state ?? ""));
      if (failed) {
        throw new MusicApiError(`MusicAPI generation failed (state: ${failed.state})`, 502);
      }
      // Generation comes back as a pair that finish independently -- use
      // whichever succeeds first.
      const ready = songs.find((s) => s.state === "succeeded" && s.audio_url);
      if (ready) return ready;
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new MusicApiError("MusicAPI generation timed out", 504);
}

export async function generateMusic(params: GenerateMusicParams): Promise<GenerateMusicResult> {
  if (!MUSICAPI_KEY) {
    throw new Error("MUSICAPI_KEY is not set");
  }

  const headers = {
    Authorization: `Bearer ${MUSICAPI_KEY}`,
    "Content-Type": "application/json",
  };

  const title = deriveFallbackTitle(params.lyricsText, params.stylePrompt);
  const requestBody: Record<string, unknown> = {
    mv: MODEL_VERSION,
    title,
    tags: buildTags(params),
    custom_mode: !params.instrumental,
  };
  if (params.instrumental) {
    requestBody.gpt_description_prompt = params.stylePrompt;
  } else {
    requestBody.prompt = stripStageDirections(params.lyricsText);
  }

  const createRes = await fetchWithTimeout(`${BASE_URL}/api/v1/sonic/create`, {
    method: "POST",
    headers,
    body: JSON.stringify(requestBody),
  });

  if (!createRes.ok) {
    const body = await createRes.json().catch(() => null);
    throw new MusicApiError(body?.error ?? `MusicAPI request failed (${createRes.status})`, createRes.status);
  }

  const created = (await createRes.json()) as { task_id?: string };
  const taskId = created.task_id;
  if (!taskId) {
    throw new MusicApiError("MusicAPI response didn't include a task_id", 502);
  }

  const song = await pollUntilDone(taskId, headers);
  const audioUrl = song.audio_url;
  if (!audioUrl) {
    throw new MusicApiError("MusicAPI response didn't include an audio URL", 502);
  }

  const audioRes = await fetchWithTimeout(audioUrl, {}, 60_000);
  if (!audioRes.ok) {
    throw new MusicApiError(`Failed to download generated audio (${audioRes.status})`, audioRes.status);
  }
  const downloaded = Buffer.from(await audioRes.arrayBuffer());
  const sourceFormat = audioUrl.endsWith(".wav") ? "wav" : audioUrl.endsWith(".ogg") ? "ogg" : "mp3";
  const audio = sourceFormat === "mp3" ? downloaded : await transcodeToMp3(downloaded);

  return {
    audio,
    format: "mp3",
    title: song.title ?? title,
    // No confirmed word-level timestamp support -- see file-level comment.
    wordTimestamps: [],
  };
}

/** Clones a voice from a >10s, single-speaker, publicly-reachable MP3/WAV
 * (per docs.musicapi.ai/create-voice.md) and returns a persona_id reusable
 * across future generations via task_type: "persona_music". UNVERIFIED --
 * no live test yet; the poll response shape below (data as a single object
 * with persona_id, not the song array the rest of this file expects) comes
 * from that doc page's example, not a confirmed live call. */
export async function createVoicePersona(audioUrl: string): Promise<{ personaId: string; name: string | null }> {
  if (!MUSICAPI_KEY) throw new Error("MUSICAPI_KEY is not set");
  const headers = { Authorization: `Bearer ${MUSICAPI_KEY}`, "Content-Type": "application/json" };

  const createRes = await fetchWithTimeout(`${BASE_URL}/api/v1/sonic/create-voice`, {
    method: "POST",
    headers,
    body: JSON.stringify({ audio_url: audioUrl }),
  });
  if (!createRes.ok) {
    const body = await createRes.json().catch(() => null);
    throw new MusicApiError(body?.error ?? `MusicAPI create-voice request failed (${createRes.status})`, createRes.status);
  }
  const created = (await createRes.json()) as { task_id?: string };
  const taskId = created.task_id;
  if (!taskId) throw new MusicApiError("MusicAPI create-voice response didn't include a task_id", 502);

  const maxAttempts = 36; // ~3 min at 5s intervals -- voice cloning is a lighter job than a full song
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let res: Response;
    try {
      res = await fetchWithTimeout(`${BASE_URL}/api/v1/sonic/task/${taskId}`, { headers });
    } catch {
      await new Promise((r) => setTimeout(r, 5000));
      continue;
    }
    if (res.status !== 202 && !res.ok) {
      const body = await res.json().catch(() => null);
      throw new MusicApiError(body?.error ?? `MusicAPI voice status check failed (${res.status})`, res.status);
    }
    if (res.ok) {
      const data = (await res.json()) as { data?: { persona_id?: string; name?: string } };
      const personaId = data.data?.persona_id;
      if (personaId) return { personaId, name: data.data?.name ?? null };
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new MusicApiError("MusicAPI voice creation timed out", 504);
}

/** Generates a new song sung by a previously-cloned voice persona
 * (task_type: "persona_music"), reusing the same tags/lyrics building and
 * polling logic as generateMusic(). */
export async function generateWithPersona(
  params: GenerateMusicParams,
  personaId: string,
): Promise<GenerateMusicResult> {
  if (!MUSICAPI_KEY) throw new Error("MUSICAPI_KEY is not set");
  const headers = { Authorization: `Bearer ${MUSICAPI_KEY}`, "Content-Type": "application/json" };

  const title = deriveFallbackTitle(params.lyricsText, params.stylePrompt);
  const requestBody: Record<string, unknown> = {
    task_type: "persona_music",
    persona_id: personaId,
    mv: MODEL_VERSION,
    title,
    tags: buildTags(params),
    custom_mode: !params.instrumental,
  };
  if (params.instrumental) {
    requestBody.gpt_description_prompt = params.stylePrompt;
  } else {
    requestBody.prompt = stripStageDirections(params.lyricsText);
  }

  const createRes = await fetchWithTimeout(`${BASE_URL}/api/v1/sonic/create`, {
    method: "POST",
    headers,
    body: JSON.stringify(requestBody),
  });
  if (!createRes.ok) {
    const body = await createRes.json().catch(() => null);
    throw new MusicApiError(body?.error ?? `MusicAPI persona request failed (${createRes.status})`, createRes.status);
  }
  const created = (await createRes.json()) as { task_id?: string };
  const taskId = created.task_id;
  if (!taskId) throw new MusicApiError("MusicAPI persona response didn't include a task_id", 502);

  const song = await pollUntilDone(taskId, headers);
  const audioUrl = song.audio_url;
  if (!audioUrl) throw new MusicApiError("MusicAPI persona response didn't include an audio URL", 502);

  const audioRes = await fetchWithTimeout(audioUrl, {}, 60_000);
  if (!audioRes.ok) throw new MusicApiError(`Failed to download generated audio (${audioRes.status})`, audioRes.status);
  const downloaded = Buffer.from(await audioRes.arrayBuffer());
  const sourceFormat = audioUrl.endsWith(".wav") ? "wav" : audioUrl.endsWith(".ogg") ? "ogg" : "mp3";
  const audio = sourceFormat === "mp3" ? downloaded : await transcodeToMp3(downloaded);

  return { audio, format: "mp3", title: song.title ?? title, wordTimestamps: [] };
}

/** Generates a new song using an existing (publicly-reachable) track as a
 * style/melody reference via task_type: "cover_music" -- the closest thing
 * this API offers to "inspired by this song" for a brand-new generation.
 * `audioWeight` near 0 gives the model more creative freedom to diverge
 * from the reference; near 1 stays close to it (docs.musicapi.ai). Default
 * kept low since the intent here is inspiration, not a literal cover. */
export async function generateWithReference(
  params: GenerateMusicParams,
  referenceAudioUrl: string,
  audioWeight = 0.3,
): Promise<GenerateMusicResult> {
  if (!MUSICAPI_KEY) throw new Error("MUSICAPI_KEY is not set");
  const headers = { Authorization: `Bearer ${MUSICAPI_KEY}`, "Content-Type": "application/json" };

  const title = deriveFallbackTitle(params.lyricsText, params.stylePrompt);
  const requestBody: Record<string, unknown> = {
    url: referenceAudioUrl,
    mv: MODEL_VERSION,
    title,
    tags: buildTags(params),
    custom_mode: !params.instrumental,
    audio_weight: Math.min(1, Math.max(0, audioWeight)),
  };
  if (params.instrumental) {
    requestBody.gpt_description_prompt = params.stylePrompt;
  } else {
    requestBody.prompt = stripStageDirections(params.lyricsText);
  }

  const createRes = await fetchWithTimeout(`${BASE_URL}/api/v1/sonic/upload-cover`, {
    method: "POST",
    headers,
    body: JSON.stringify(requestBody),
  });
  if (!createRes.ok) {
    const body = await createRes.json().catch(() => null);
    throw new MusicApiError(body?.error ?? `MusicAPI upload-cover request failed (${createRes.status})`, createRes.status);
  }
  const created = (await createRes.json()) as { task_id?: string };
  const taskId = created.task_id;
  if (!taskId) throw new MusicApiError("MusicAPI upload-cover response didn't include a task_id", 502);

  const song = await pollUntilDone(taskId, headers);
  const audioUrl = song.audio_url;
  if (!audioUrl) throw new MusicApiError("MusicAPI upload-cover response didn't include an audio URL", 502);

  const audioRes = await fetchWithTimeout(audioUrl, {}, 60_000);
  if (!audioRes.ok) throw new MusicApiError(`Failed to download generated audio (${audioRes.status})`, audioRes.status);
  const downloaded = Buffer.from(await audioRes.arrayBuffer());
  const sourceFormat = audioUrl.endsWith(".wav") ? "wav" : audioUrl.endsWith(".ogg") ? "ogg" : "mp3";
  const audio = sourceFormat === "mp3" ? downloaded : await transcodeToMp3(downloaded);

  return { audio, format: "mp3", title: song.title ?? title, wordTimestamps: [] };
}
