import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";

/** Local-disk storage for generated audio, kept outside `public/` so files
 * are only reachable through the authenticated /api/songs/[id]/audio route,
 * not directly by URL. Swap for Supabase/S3 storage later without changing
 * callers -- they only deal with an opaque `storageKey`. */

const STORAGE_ROOT = path.join(process.cwd(), "storage", "songs");

export async function saveSongAudio(storageKey: string, buffer: Buffer): Promise<void> {
  await mkdir(STORAGE_ROOT, { recursive: true });
  await writeFile(path.join(STORAGE_ROOT, storageKey), buffer);
}

export async function readSongAudio(storageKey: string): Promise<Buffer> {
  return readFile(path.join(STORAGE_ROOT, storageKey));
}

export function newStorageKey(generationId: string, format: string): string {
  return `${generationId}.${format}`;
}
