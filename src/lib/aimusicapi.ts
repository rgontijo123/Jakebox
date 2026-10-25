/** Server-only wrapper around AIMusicAPI.ai's Sonic endpoint (api.aimusicapi.ai)
 * -- another unofficial Suno-adjacent wrapper, structurally near-identical to
 * musicapi.ts (same `/api/v1/sonic/create` + `/api/v1/sonic/task/{id}` path
 * shape, same request/response fields) -- likely built on shared underlying
 * infrastructure with MusicAPI.ai. Treat the two as correlated, not fully
 * independent, redundancy: if that shared upstream breaks, both probably
 * fail together. Still worth having in the chain for the cases where only
 * one of them is out of credit/down. Never import from a client component --
 * the API key must stay server-side.
 *
 * UNVERIFIED -- NO LIVE TEST YET, but built from docs.aimusicapi.ai's
 * llms.txt-linked reference pages, which (unlike most other providers here)
 * gave a genuinely complete, explicit schema -- confidence is higher than
 * the usual "guessed" disclaimer on first write, but still needs one real
 * generation to confirm, per the pattern that's caught real bugs every
 * single time so far.
 *
 * Documented request schema (POST /api/v1/sonic/create):
 *   { task_type: "create_music", custom_mode, mv ("sonic-v3-5".."sonic-v5-5"),
 *     prompt (lyrics, w/ [Verse]/[Chorus] tags, in custom_mode), title,
 *     tags, negative_tags, make_instrumental, vocal_gender ("f"|"m"),
 *     duration (10-360, seconds -- an explicit duration control musicapi.ts's
 *     provider doesn't document), style_weight (0-1), weirdness_constraint
 *     (0-1), use_suno_cdn }. Response: { code, task_id, message }.
 *
 *   Poll GET /api/v1/sonic/task/{task_id} -> { code, message, data: [song] }
 *   (documented as a single-item array here, vs. musicapi.ts's confirmed
 *   pair -- if it also comes back as a pair in practice, picking the first
 *   "succeeded" entry below still works fine either way). Song: { clip_id,
 *   state ("pending"|"running"|"succeeded"|"failed"), title, audio_url,
 *   duration (integer seconds), tags, lyrics, image_url, video_url,
 *   created_at, mv }. A 202 mid-generation carries `stream_audio_url`
 *   instead, with `audio_url: null` -- treated as "keep polling". */

import { MusicGenerationError, type GenerateMusicParams, type GenerateMusicResult } from "@/lib/musicProviderTypes";
import { transcodeToMp3 } from "@/lib/audio";
import { deriveFallbackTitle } from "@/lib/lyrics";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";

export type { GenerateMusicParams, GenerateMusicResult } from "@/lib/musicProviderTypes";

const AIMUSICAPI_KEY = process.env.AIMUSICAPI_KEY;
const BASE_URL = "https://api.aimusicapi.ai";
const MODEL_VERSION = "sonic-v5-5";

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  "pt-BR": "Brazilian Portuguese (pt-BR)",
  "pt-PT": "European Portuguese (pt-PT)",
  es: "Spanish",
  de: "German",
  ja: "Japanese",
};

export class AiMusicApiError extends MusicGenerationError {}

// Same vocal/pacing/instrument hints already proven necessary for every
// other provider in this app.
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

// Same rationale as the other providers: [Verse]/[Chorus] structure markers
// and {...} non-sung stage-direction cues are this app's display-side
// convention -- strip before sending so cue text can't get literally sung.
function stripStageDirections(lyricsText: string): string {
  return lyricsText
    .split("\n")
    .filter((line) => !/^\s*[[{][^\]}]*[\]}]\s*$/.test(line))
    .join("\n");
}

type SonicSong = { audio_url?: string | null; title?: string; state?: string; duration?: number };
type SonicTask = { data?: SonicSong[]; error?: string; message?: string };

const TERMINAL_FAILURE = /fail|error|reject|cancel/i;

async function pollUntilDone(taskId: string, headers: Record<string, string>): Promise<SonicSong> {
  const maxAttempts = 60; // ~5 min at 5s intervals
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let res: Response;
    try {
      res = await fetchWithTimeout(`${BASE_URL}/api/v1/sonic/task/${taskId}`, { headers });
    } catch {
      await new Promise((r) => setTimeout(r, 5000));
      continue;
    }
    // 202 mid-render (stream_audio_url, audio_url still null) -- not an
    // error, just keep polling.
    if (res.status !== 202 && !res.ok) {
      const body = await res.json().catch(() => null);
      throw new AiMusicApiError(body?.error ?? `AIMusicAPI status check failed (${res.status})`, res.status);
    }
    if (res.ok) {
      const data = (await res.json()) as SonicTask;
      const songs = data.data ?? [];
      const failed = songs.find((s) => TERMINAL_FAILURE.test(s.state ?? ""));
      if (failed) {
        throw new AiMusicApiError(`AIMusicAPI generation failed (state: ${failed.state})`, 502);
      }
      const ready = songs.find((s) => s.state === "succeeded" && s.audio_url);
      if (ready) return ready;
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new AiMusicApiError("AIMusicAPI generation timed out", 504);
}

export async function generateMusic(params: GenerateMusicParams): Promise<GenerateMusicResult> {
  if (!AIMUSICAPI_KEY) {
    throw new Error("AIMUSICAPI_KEY is not set");
  }

  const headers = {
    Authorization: `Bearer ${AIMUSICAPI_KEY}`,
    "Content-Type": "application/json",
  };

  const title = deriveFallbackTitle(params.lyricsText, params.stylePrompt);
  const requestBody: Record<string, unknown> = {
    task_type: "create_music",
    mv: MODEL_VERSION,
    title,
    tags: buildTags(params),
    custom_mode: !params.instrumental,
    make_instrumental: params.instrumental,
    duration: Math.min(360, Math.max(10, params.targetDurationSeconds)),
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
    throw new AiMusicApiError(body?.error ?? `AIMusicAPI request failed (${createRes.status})`, createRes.status);
  }

  const created = (await createRes.json()) as { task_id?: string };
  const taskId = created.task_id;
  if (!taskId) {
    throw new AiMusicApiError("AIMusicAPI response didn't include a task_id", 502);
  }

  const song = await pollUntilDone(taskId, headers);
  const audioUrl = song.audio_url;
  if (!audioUrl) {
    throw new AiMusicApiError("AIMusicAPI response didn't include an audio URL", 502);
  }

  const audioRes = await fetchWithTimeout(audioUrl, {}, 60_000);
  if (!audioRes.ok) {
    throw new AiMusicApiError(`Failed to download generated audio (${audioRes.status})`, audioRes.status);
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
