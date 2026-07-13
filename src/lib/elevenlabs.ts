/** Server-only wrapper around the ElevenLabs Music API. Never import this
 * from a client component -- the API key must stay server-side. */

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const BASE_URL = "https://api.elevenlabs.io/v1";

export type LyricSection = {
  type: "verse" | "chorus" | "bridge" | "intro" | "outro" | "pre_chorus";
  text: string;
};

export type GenerateMusicParams = {
  stylePrompt: string;
  lyricsSections: LyricSection[];
  instrumental: boolean;
  targetDurationSeconds: number;
};

export type GenerateMusicResult = {
  audio: Buffer;
  format: "mp3";
  durationSeconds: number;
};

function buildPrompt(params: GenerateMusicParams): string {
  if (params.instrumental || params.lyricsSections.length === 0) {
    return params.stylePrompt;
  }

  const lyricsText = params.lyricsSections
    .map((s) => `[${s.type.replace("_", "-")}]\n${s.text}`)
    .join("\n\n");

  return `${params.stylePrompt}\n\nLyrics:\n${lyricsText}`;
}

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

export async function generateMusic(params: GenerateMusicParams): Promise<GenerateMusicResult> {
  if (!ELEVENLABS_API_KEY) {
    throw new Error("ELEVENLABS_API_KEY is not set");
  }

  const musicLengthMs = Math.round(
    Math.min(params.targetDurationSeconds, 300) * 1000,
  );

  const res = await fetch(`${BASE_URL}/music`, {
    method: "POST",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: buildPrompt(params),
      music_length_ms: musicLengthMs,
      force_instrumental: params.instrumental,
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

  const arrayBuffer = await res.arrayBuffer();
  const audio = Buffer.from(arrayBuffer);

  // ElevenLabs doesn't return exact duration in headers for this endpoint,
  // so callers should measure the actual file (see lib/audio.ts) rather
  // than trust the requested length.
  return {
    audio,
    format: "mp3",
    durationSeconds: params.targetDurationSeconds,
  };
}
