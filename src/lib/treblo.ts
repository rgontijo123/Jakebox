/** Server-only wrapper around the Treblo Melodia API (api.treblo.com).
 * Never import this from a client component -- the API key must stay
 * server-side.
 *
 * Response shape confirmed against live v3 (2026-09-09) and v2 (2026-09-12)
 * generations: generation status and alignment status are two separate
 * fields (`status`, `alignment_status`), both reaching "SUCCESS"
 * independently; word timing comes back as a flat `word_aligned_lyrics`
 * array with `start`/`end` in fractional seconds (not ms); audio is served
 * as .ogg (audio/ogg), not mp3; neither version returns a title. */

import { MusicGenerationError, type GenerateMusicParams, type GenerateMusicResult } from "@/lib/musicProviderTypes";
import { transcodeToMp3 } from "@/lib/audio";

export type { GenerateMusicParams, GenerateMusicResult } from "@/lib/musicProviderTypes";

const TREBLO_API_KEY = process.env.TREBLO_API_KEY;
const BASE_URL = "https://api.treblo.com/v1";

// v3 is still "v3-preview" -- Treblo's own docs warn results can occasionally
// be *worse* than v2 during this beta period, and that matched what we saw:
// a psytrance/techno request came back without real genre-appropriate
// instrumentation even after raising style_scale. v2 additionally accepts an
// explicit `bpm`, which v3 has no equivalent for and which matters a lot for
// a tempo-defined genre like psytrance. Kept switchable via env in case v3
// improves or a specific song does better on it.
const MODEL_VERSION = process.env.TREBLO_MODEL_VERSION === "v3" ? "v3" : "v2";

// Picks up an explicit "145 BPM" / "128bpm" mentioned in the style prompt so
// tempo-defined genres (psytrance, techno...) get it passed as a real v2
// `bpm` value instead of hoping the model infers it from prose. v3 has no
// bpm field, so this only matters when MODEL_VERSION is "v2".
function extractBpm(stylePrompt: string): number | "auto" {
  const match = stylePrompt.match(/(\d{2,3})\s*bpm/i);
  return match ? Number(match[1]) : "auto";
}

// Same rationale as elevenlabs.ts: the API infers pronunciation from the
// prompt text, so spell the language out explicitly, especially for
// Brazilian vs. European Portuguese.
const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  "pt-BR": "Brazilian Portuguese (pt-BR)",
  "pt-PT": "European Portuguese (pt-PT)",
  es: "Spanish",
  de: "German",
  ja: "Japanese",
};

export class TrebloError extends MusicGenerationError {}

// Same fix already proven necessary for ElevenLabs (see elevenlabs.ts's
// buildPrompt): leaving vocal delivery unspecified lets the model default to
// flat, talked/spoken-word delivery with no real melody instead of actual
// singing -- genre tags alone ("pop", "psytrance") describe instrumentation,
// not vocal delivery. Observed directly: a Treblo v3 generation came back
// "sem melodia" (no melody) without these hints. Ask for it explicitly, and
// also steer away from it via negative_tags below.
const VOCAL_HINT =
  "melodic sung vocals with a clear musical melody, not spoken word, not rap, not monotone narration";
// User feedback on a real generation: needs an actual pause after commas
// and at the end of each lyric line, not just an unhurried pace overall.
const PACING_HINT =
  "natural, unhurried vocal pacing, not rushed -- a brief pause after every comma, and a clear breathing pause at the end of every line";
const INSTRUMENT_HINT =
  "full instrumental arrangement (drums, bass, and other instruments as fits the genre) playing continuously under the vocals";

// Treblo's forced aligner walks the whole `lyrics` string as the reference
// transcript, tag lines included -- it does not skip [Verse]/[Chorus]
// structure markers or {...} stage-direction cues (this app's own
// convention for non-sung production notes) the way the generation model
// itself presumably does. Left in, unalignable tag text gets dumped onto
// the nearest real word instead of getting its own slot: two live v3
// generations of the same song came back with alignment tokens literally
// reading "[Intro]\n{ghostly..." and then, after cues alone were stripped,
// "[Intro]\n\n[Verse 1]\nNo" -- structure tags alone still gluing onto the
// first real word. Strip both tag forms before sending, matching what
// elevenlabs.ts's composition-plan path already does for the same reason.
function stripStageDirections(lyricsText: string): string {
  return lyricsText
    .split("\n")
    .filter((line) => !/^\s*[[{][^\]}]*[\]}]\s*$/.test(line))
    .join("\n");
}

function buildPrompt(params: GenerateMusicParams): string {
  const languageName = LANGUAGE_NAMES[params.language] ?? params.language;
  const needsLanguageHint = !params.instrumental && languageName !== "English";
  const languagePrefix = needsLanguageHint ? `[${languageName} vocals, native accent] ` : "";

  if (params.instrumental) {
    return params.stylePrompt;
  }

  return `${languagePrefix}${params.stylePrompt}. ${VOCAL_HINT}. ${PACING_HINT}. ${INSTRUMENT_HINT}.`;
}

// length_range values must be multiples of 30, min in 0-270, max in 30-300
// (per Treblo's documented constraints). Build a [min, max] window around
// the requested duration rather than pinning an exact value, since we don't
// know how strictly the model honors a single-point target.
function buildLengthRange(targetDurationSeconds: number): [number, number] {
  const rounded = Math.round(targetDurationSeconds / 30) * 30;
  const max = Math.min(300, Math.max(30, rounded));
  const min = Math.min(270, Math.max(0, max - 30));
  return [min, max];
}

type TrebloGenerationResponse = {
  id?: string;
  status?: string; // PROMPT -> GENERATING -> SAVING -> SUCCESS | FAILURE
  alignment_status?: string; // REQUESTED -> TASK_SENT -> ALIGNING -> SUCCESS
  song_paths?: string[] | null;
  error_message?: string | null;
  word_aligned_lyrics?: { word: string; start: number; end: number }[] | null;
};

const TERMINAL_FAILURE = /fail|error|reject/i;

async function pollUntilDone(
  taskId: string,
  headers: Record<string, string>,
  waitForAlignment: boolean,
): Promise<TrebloGenerationResponse> {
  const maxAttempts = 60; // ~5 min at 5s intervals
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res = await fetch(`${BASE_URL}/generations/${taskId}`, { headers });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new TrebloError(body?.error_message ?? `Treblo status check failed (${res.status})`, res.status);
    }
    const data = (await res.json()) as TrebloGenerationResponse;
    const status = data.status ?? "";
    const alignmentStatus = data.alignment_status ?? "";
    if (TERMINAL_FAILURE.test(status) || TERMINAL_FAILURE.test(alignmentStatus)) {
      throw new TrebloError(data.error_message ?? `Treblo generation failed (status: ${status})`, 502);
    }
    const generationDone = status === "SUCCESS" && !!data.song_paths?.length;
    const alignmentDone = !waitForAlignment || alignmentStatus === "SUCCESS";
    if (generationDone && alignmentDone) {
      return data;
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new TrebloError("Treblo generation timed out", 504);
}

export async function generateMusic(params: GenerateMusicParams): Promise<GenerateMusicResult> {
  if (!TREBLO_API_KEY) {
    throw new Error("TREBLO_API_KEY is not set");
  }

  const headers = {
    Authorization: `Bearer ${TREBLO_API_KEY}`,
    "Content-Type": "application/json",
  };

  const [minSeconds, maxSeconds] = buildLengthRange(params.targetDurationSeconds);
  const requestBody: Record<string, unknown> = {
    prompt: buildPrompt(params),
    instrumental: params.instrumental,
    lyrics: params.instrumental ? undefined : stripStageDirections(params.lyricsText),
    align_lyrics: !params.instrumental,
    // `tags` can't be combined with `prompt` + `lyrics` (the API 422s:
    // "cannot provide all three tags, lyrics, and prompt") -- since
    // stylePrompt is free-text prose, not enumerable tags, we always go
    // through the prompt path and can only use `negative_tags` here, which
    // is compatible. Its values are validated against Treblo's fixed
    // style-tag vocabulary (confirmed by trial: "monotone"/"talking"/
    // "narration" 422 as unknown tags; the ones below are confirmed valid).
    negative_tags: params.instrumental ? [] : ["spoken word", "a cappella", "no melody", "rap"],
  };

  if (MODEL_VERSION === "v3") {
    // length_range: v3-only, [min, max] seconds, multiples of 30, min in
    // 0-270, max in 30-300. style_scale (default 4.5, range 1.0-12.0):
    // how strongly generation adheres to the described style, trading off
    // some naturalness for it -- pushed up since the default under-delivered
    // on genre-specific instrumentation for electronic sub-genres.
    requestBody.length_range = [minSeconds, maxSeconds];
    requestBody.style_scale = 7.0;
  } else {
    // v2-only: explicit bpm (matters a lot for a tempo-defined genre like
    // psytrance/techno) and length_range isn't honored on v2 (confirmed by
    // trial -- a [30,60] request produced a ~95s track), so target duration
    // is only advisory here; actual duration still flows through normally
    // via getAudioDurationSeconds + the credit refund path.
    requestBody.bpm = extractBpm(params.stylePrompt);
  }

  const createRes = await fetch(`${BASE_URL}/generations/${MODEL_VERSION}`, {
    method: "POST",
    headers,
    body: JSON.stringify(requestBody),
  });

  if (!createRes.ok) {
    const body = await createRes.json().catch(() => null);
    throw new TrebloError(body?.error_message ?? `Treblo request failed (${createRes.status})`, createRes.status);
  }

  const created = (await createRes.json()) as { task_id?: string };
  const taskId = created.task_id;
  if (!taskId) {
    throw new TrebloError("Treblo response didn't include a task_id", 502);
  }

  const finished = await pollUntilDone(taskId, headers, !params.instrumental);

  const audioUrl = finished.song_paths![0];
  const audioRes = await fetch(audioUrl);
  if (!audioRes.ok) {
    throw new TrebloError(`Failed to download generated audio (${audioRes.status})`, audioRes.status);
  }
  const downloaded = Buffer.from(await audioRes.arrayBuffer());
  const sourceFormat = audioUrl.endsWith(".wav") ? "wav" : audioUrl.endsWith(".mp3") ? "mp3" : "ogg";
  // Normalize to mp3 -- Safari/iOS doesn't reliably play Ogg+Opus, which is
  // what Treblo actually serves.
  const audio = sourceFormat === "mp3" ? downloaded : await transcodeToMp3(downloaded);
  const format = "mp3";

  const wordTimestamps = (finished.word_aligned_lyrics ?? []).map((w) => ({
    word: w.word.trim(),
    startMs: Math.round(w.start * 1000),
    endMs: Math.round(w.end * 1000),
  }));

  return {
    audio,
    format,
    title: null, // neither v2 nor v3 generation responses include a title field
    wordTimestamps,
  };
}
