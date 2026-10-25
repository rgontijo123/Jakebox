/** Server-only wrapper around the Mureka API (api.mureka.ai, Kunlun Tech).
 * Never import this from a client component -- the API key must stay
 * server-side.
 *
 * UNVERIFIED -- NO LIVE TEST YET. platform.mureka.ai/docs renders its full
 * request/response schema via JS (vitepress-openapi), which a server-side
 * fetch can't see, and there's no API key to test against live yet. What's
 * below is built from the one confirmed real example (their quickstart's
 * curl call and its immediate task-creation response) plus reasonable
 * guesses for the rest, marked where they're guesses. Once a
 * MUREKA_API_KEY exists, generate one real song and fix whatever's wrong
 * here against the actual response -- exactly what had to happen for
 * treblo.ts (three real mismatches turned up that way: wrong field names,
 * wrong audio format, wrong status shape).
 *
 * Confirmed from Mureka's own quickstart example:
 *   POST https://api.mureka.ai/v1/song/generate
 *   Headers: Authorization: Bearer <key>, Content-Type: application/json
 *   Body: { lyrics, prompt, model: "auto" }
 *   Immediate response: { id, created_at, model, status: "preparing", trace_id }
 *   -> poll GET /v1/song/query/{id} until done.
 *
 * GUESSED (unconfirmed, needs a real response to check):
 *   - Instrumental tracks go through a separate `/v1/instrumental/generate`
 *     + `/v1/instrumental/query/{id}` pair (Mureka's docs nav lists "Song"
 *     and "Instrumental" as separate top-level sections with their own
 *     generate/query endpoints, unlike ElevenLabs/Treblo's single endpoint +
 *     instrumental boolean).
 *   - Terminal status strings (guessed "succeeded"/"completed" vs
 *     "failed"/"error" -- only "preparing" as an initial value is confirmed).
 *   - Response audio field name/shape on the completed task (guessed a
 *     `choices` or `songs` array with an `mp3_url` per entry, per
 *     third-party wrapper docs of this same underlying API -- those wrap
 *     the real API rather than being it, so this could easily be wrong).
 *   - No word-level lyric timestamp/alignment endpoint appears anywhere in
 *     Mureka's documented endpoint list (unlike ElevenLabs and Treblo, which
 *     both return per-word timing). Until proven otherwise, treat Mureka as
 *     not supporting the word-highlight feature -- returns wordTimestamps: []. */

import { MusicGenerationError, type GenerateMusicParams, type GenerateMusicResult } from "@/lib/musicProviderTypes";
import { transcodeToMp3 } from "@/lib/audio";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";

export type { GenerateMusicParams, GenerateMusicResult } from "@/lib/musicProviderTypes";

const MUREKA_API_KEY = process.env.MUREKA_API_KEY;
const BASE_URL = "https://api.mureka.ai";

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  "pt-BR": "Brazilian Portuguese (pt-BR)",
  "pt-PT": "European Portuguese (pt-PT)",
  es: "Spanish",
  de: "German",
  ja: "Japanese",
};

export class MurekaError extends MusicGenerationError {}

// Same vocal/pacing/instrument hints already proven necessary for
// ElevenLabs and Treblo -- genre tags alone leave vocal delivery
// unspecified and models default to flat, rushed, or spoken-word delivery.
const VOCAL_HINT =
  "melodic sung vocals with a clear musical melody, not spoken word, not rap, not monotone narration";
const PACING_HINT =
  "natural, unhurried vocal pacing, not rushed -- a brief pause after every comma, and a clear breathing pause at the end of every line";
const INSTRUMENT_HINT =
  "full instrumental arrangement (drums, bass, and other instruments as fits the genre) playing continuously under the vocals";

function buildPrompt(params: GenerateMusicParams): string {
  const languageName = LANGUAGE_NAMES[params.language] ?? params.language;
  const needsLanguageHint = !params.instrumental && languageName !== "English";
  const languagePrefix = needsLanguageHint ? `[${languageName} vocals, native accent] ` : "";

  if (params.instrumental) return params.stylePrompt;
  return `${languagePrefix}${params.stylePrompt}. ${VOCAL_HINT}. ${PACING_HINT}. ${INSTRUMENT_HINT}.`;
}

// Same rationale as treblo.ts's stripStageDirections: [Verse]/[Chorus]
// structure markers and {...} non-sung stage-direction cues are this app's
// display-side convention, not necessarily something Mureka's own lyrics
// parser expects -- strip them from what's actually sent so cue text can't
// get literally sung or mis-aligned. Unverified for Mureka specifically, but
// safe either way since the tags carry no information the prompt hints
// above don't already cover.
function stripStageDirections(lyricsText: string): string {
  return lyricsText
    .split("\n")
    .filter((line) => !/^\s*[[{][^\]}]*[\]}]\s*$/.test(line))
    .join("\n");
}

type MurekaTask = {
  id?: string;
  status?: string;
  choices?: { url?: string; mp3_url?: string; audio_url?: string; duration?: number }[];
  songs?: { url?: string; mp3_url?: string; audio_url?: string; duration_milliseconds?: number; title?: string }[];
  failed_reason?: string;
  error?: { message?: string };
};

// Confirmed error shape: { error: { message }, trace_id } (e.g. a 429 quota
// response), not a plain string field -- fixed after seeing a real one.
function errorMessageFrom(body: { error?: { message?: string }; failed_reason?: string } | null): string | undefined {
  return body?.error?.message ?? body?.failed_reason;
}

const TERMINAL_FAILURE = /fail|error|reject/i;
const TERMINAL_SUCCESS = /success|succeed|complete|done/i;

async function pollUntilDone(endpointBase: string, taskId: string, headers: Record<string, string>): Promise<MurekaTask> {
  const maxAttempts = 60; // ~5 min at 5s intervals
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let res: Response;
    try {
      res = await fetchWithTimeout(`${BASE_URL}${endpointBase}/query/${taskId}`, { headers });
    } catch {
      await new Promise((r) => setTimeout(r, 5000));
      continue;
    }
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new MurekaError(errorMessageFrom(body) ?? `Mureka status check failed (${res.status})`, res.status);
    }
    const data = (await res.json()) as MurekaTask;
    const status = data.status ?? "";
    if (TERMINAL_FAILURE.test(status)) {
      throw new MurekaError(errorMessageFrom(data) ?? `Mureka generation failed (status: ${status})`, 502);
    }
    const hasAudio = !!(data.choices?.length || data.songs?.length);
    if (TERMINAL_SUCCESS.test(status) && hasAudio) {
      return data;
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new MurekaError("Mureka generation timed out", 504);
}

export async function generateMusic(params: GenerateMusicParams): Promise<GenerateMusicResult> {
  if (!MUREKA_API_KEY) {
    throw new Error("MUREKA_API_KEY is not set");
  }

  const headers = {
    Authorization: `Bearer ${MUREKA_API_KEY}`,
    "Content-Type": "application/json",
  };

  const endpointBase = params.instrumental ? "/v1/instrumental" : "/v1/song";
  const requestBody: Record<string, unknown> = {
    prompt: buildPrompt(params),
    model: "auto",
  };
  if (!params.instrumental) {
    requestBody.lyrics = stripStageDirections(params.lyricsText);
  }

  const createRes = await fetchWithTimeout(
    `${BASE_URL}${endpointBase}/generate`,
    { method: "POST", headers, body: JSON.stringify(requestBody) },
    45_000,
  );

  if (!createRes.ok) {
    const body = await createRes.json().catch(() => null);
    throw new MurekaError(errorMessageFrom(body) ?? `Mureka request failed (${createRes.status})`, createRes.status);
  }

  const created = (await createRes.json()) as { id?: string };
  const taskId = created.id;
  if (!taskId) {
    throw new MurekaError("Mureka response didn't include a task id", 502);
  }

  const finished = await pollUntilDone(endpointBase, taskId, headers);

  const entry = finished.choices?.[0] ?? finished.songs?.[0];
  const audioUrl = entry?.url ?? entry?.mp3_url ?? entry?.audio_url;
  if (!audioUrl) {
    throw new MurekaError("Mureka response didn't include an audio URL", 502);
  }

  const audioRes = await fetchWithTimeout(audioUrl, {}, 60_000);
  if (!audioRes.ok) {
    throw new MurekaError(`Failed to download generated audio (${audioRes.status})`, audioRes.status);
  }
  const downloaded = Buffer.from(await audioRes.arrayBuffer());
  const sourceFormat = audioUrl.endsWith(".wav") ? "wav" : audioUrl.endsWith(".ogg") ? "ogg" : "mp3";
  const audio = sourceFormat === "mp3" ? downloaded : await transcodeToMp3(downloaded);

  return {
    audio,
    format: "mp3",
    title: (entry as { title?: string })?.title ?? null,
    // No confirmed word-level timestamp support in Mureka's API -- see
    // file-level comment. Playback still works; per-word lyric highlighting
    // just won't for songs generated through this provider.
    wordTimestamps: [],
  };
}
