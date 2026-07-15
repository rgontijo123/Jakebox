/** Server-only wrapper around the ElevenLabs Music API. Never import this
 * from a client component -- the API key must stay server-side. */

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const BASE_URL = "https://api.elevenlabs.io/v1";

export type GenerateMusicParams = {
  stylePrompt: string;
  lyricsText: string; // raw text, Suno-style, may contain [Verse]/[Chorus]/etc tags inline
  instrumental: boolean;
  targetDurationSeconds: number;
  language: string; // e.g. "pt-BR", "en" -- see LANGUAGE_NAMES below
};

// The Music API has no dedicated language/locale parameter -- it infers
// pronunciation from the prompt text, so we spell it out explicitly. This
// matters most for Portuguese: "Portuguese" alone tends to default toward
// European pronunciation, which reads as noticeably wrong to Brazilian ears.
const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  "pt-BR": "Brazilian Portuguese (pt-BR)",
  "pt-PT": "European Portuguese (pt-PT)",
  es: "Spanish",
  de: "German",
  ja: "Japanese",
};

export type WordTimestamp = { word: string; startMs: number; endMs: number };

export type GenerateMusicResult = {
  audio: Buffer;
  format: "mp3";
  title: string | null;
  wordTimestamps: WordTimestamp[];
};

export class ElevenLabsError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "ElevenLabsError";
  }
}

function buildPrompt(params: GenerateMusicParams): string {
  const languageName = LANGUAGE_NAMES[params.language] ?? params.language;
  const needsLanguageHint = !params.instrumental && languageName !== "English";

  // Lead with the language instruction (models weight earlier tokens more
  // heavily) and repeat it right before the lyrics too -- a single mention
  // at the end of a long style description was getting lost, especially on
  // longer songs where ElevenLabs is documented to drift accent/language
  // partway through. The bracketed "[X accent]" tag is confirmed to work
  // for their Text-to-Speech v3 model; it's undocumented for Music, but
  // costs nothing to include since Music already respects bracketed
  // production tags like [Verse]/[Chorus] elsewhere in the prompt.
  const styleWithLanguage = needsLanguageHint
    ? `IMPORTANT: All vocals must be sung entirely in natural ${languageName}, with authentic ${languageName} pronunciation maintained consistently for the whole song, from the first word to the last. [${languageName} accent] ${params.stylePrompt}`
    : params.stylePrompt;

  if (params.instrumental || !params.lyricsText.trim()) {
    return styleWithLanguage;
  }

  const lyricsHeader = needsLanguageHint ? `Lyrics (sung in ${languageName}):` : "Lyrics:";
  const accentTagLine = needsLanguageHint ? `[${languageName} accent]\n` : "";
  return `${styleWithLanguage}\n\n${lyricsHeader}\n${accentTagLine}${params.lyricsText}`;
}

/** Splits a multipart/mixed response (one JSON part with metadata +
 * word timestamps, one audio/mpeg part with the raw MP3) into its pieces.
 * Operates on Buffers throughout so the binary audio part never gets
 * mangled by a string round-trip. */
function parseMultipart(body: Buffer, boundary: string): { json: unknown; audio: Buffer } {
  const boundaryBuf = Buffer.from(`--${boundary}`);
  const parts: Buffer[] = [];
  let searchStart = 0;

  while (true) {
    const start = body.indexOf(boundaryBuf, searchStart);
    if (start === -1) break;
    const partStart = start + boundaryBuf.length;
    const nextBoundary = body.indexOf(boundaryBuf, partStart);
    if (nextBoundary === -1) break;
    parts.push(body.subarray(partStart, nextBoundary));
    searchStart = nextBoundary;
  }

  let json: unknown = null;
  let audio: Buffer | null = null;

  for (const part of parts) {
    const headerEnd = part.indexOf("\r\n\r\n");
    if (headerEnd === -1) continue;
    const headers = part.subarray(0, headerEnd).toString("utf-8");
    // trim the leading \r\n left over from the boundary line, and the
    // trailing \r\n-- before the next boundary marker
    let content = part.subarray(headerEnd + 4);
    if (content.subarray(-2).toString() === "\r\n") {
      content = content.subarray(0, -2);
    }

    if (headers.includes("application/json")) {
      json = JSON.parse(content.toString("utf-8"));
    } else if (headers.includes("audio/")) {
      audio = content;
    }
  }

  if (!audio) {
    throw new Error("ElevenLabs response didn't include an audio part");
  }
  return { json, audio };
}

export async function generateMusic(params: GenerateMusicParams): Promise<GenerateMusicResult> {
  if (!ELEVENLABS_API_KEY) {
    throw new Error("ELEVENLABS_API_KEY is not set");
  }

  const musicLengthMs = Math.round(Math.min(params.targetDurationSeconds, 300) * 1000);

  const res = await fetch(`${BASE_URL}/music/detailed`, {
    method: "POST",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: buildPrompt(params),
      music_length_ms: musicLengthMs,
      force_instrumental: params.instrumental,
      with_timestamps: !params.instrumental,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ElevenLabsError(
      body?.detail?.message ?? `ElevenLabs request failed (${res.status})`,
      res.status,
      body?.detail?.code,
    );
  }

  const contentType = res.headers.get("content-type") ?? "";
  const bodyBuffer = Buffer.from(await res.arrayBuffer());

  const boundaryMatch = contentType.match(/boundary=([^;]+)/);
  if (!boundaryMatch) {
    // no timestamps requested (instrumental) -- plain audio response
    return { audio: bodyBuffer, format: "mp3", title: null, wordTimestamps: [] };
  }

  const { json, audio } = parseMultipart(bodyBuffer, boundaryMatch[1]);
  const meta = json as {
    song_metadata?: { title?: string };
    words_timestamps?: { word: string; start_ms: number; end_ms: number }[];
  } | null;

  return {
    audio,
    format: "mp3",
    title: meta?.song_metadata?.title ?? null,
    wordTimestamps:
      meta?.words_timestamps?.map((w) => ({ word: w.word, startMs: w.start_ms, endMs: w.end_ms })) ?? [],
  };
}
