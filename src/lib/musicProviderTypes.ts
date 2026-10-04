/** Shared types/errors for music generation providers (ElevenLabs, Treblo, ...).
 * Kept dependency-free so both provider modules and the provider switch can
 * import it without a circular import. */

export type GenerateMusicParams = {
  stylePrompt: string;
  lyricsText: string; // raw text, Suno-style, may contain [Verse]/[Chorus]/etc tags inline
  instrumental: boolean;
  targetDurationSeconds: number;
  language: string; // e.g. "pt-BR", "en"
};

export type WordTimestamp = { word: string; startMs: number; endMs: number };

export type GenerateMusicResult = {
  audio: Buffer;
  format: "mp3" | "wav" | "ogg";
  title: string | null;
  wordTimestamps: WordTimestamp[];
  // Which backend actually produced this (set by musicProvider.ts, not by
  // the individual provider modules themselves) -- recorded on the Song row
  // so generations can be compared across providers later.
  provider?: string;
};

export class MusicGenerationError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "MusicGenerationError";
  }
}
