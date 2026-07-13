import { parseBuffer } from "music-metadata";

export async function getAudioDurationSeconds(buffer: Buffer, mimeType = "audio/mpeg"): Promise<number> {
  const metadata = await parseBuffer(buffer, mimeType);
  return Math.round(metadata.format.duration ?? 0);
}
