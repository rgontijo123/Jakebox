import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";

/** Local-disk storage for generated audio/video, kept outside `public/` so
 * files are only reachable through the authenticated /api/songs/[id]/audio
 * and /api/songs/[id]/video routes, not directly by URL. Swap for
 * Supabase/S3 storage later without changing callers -- they only deal with
 * an opaque `storageKey`. */

const SONGS_ROOT = path.join(process.cwd(), "storage", "songs");
const VIDEOS_ROOT = path.join(process.cwd(), "storage", "videos");
const THUMBNAILS_ROOT = path.join(process.cwd(), "storage", "thumbnails");

export async function saveSongAudio(storageKey: string, buffer: Buffer): Promise<void> {
  await mkdir(SONGS_ROOT, { recursive: true });
  await writeFile(path.join(SONGS_ROOT, storageKey), buffer);
}

export async function readSongAudio(storageKey: string): Promise<Buffer> {
  return readFile(path.join(SONGS_ROOT, storageKey));
}

export function newStorageKey(generationId: string, format: string): string {
  return `${generationId}.${format}`;
}

export async function saveSongVideo(storageKey: string, buffer: Buffer): Promise<void> {
  await mkdir(VIDEOS_ROOT, { recursive: true });
  await writeFile(path.join(VIDEOS_ROOT, storageKey), buffer);
}

export async function readSongVideo(storageKey: string): Promise<Buffer> {
  return readFile(path.join(VIDEOS_ROOT, storageKey));
}

export function newVideoStorageKey(generationId: string): string {
  return `${generationId}.mp4`;
}

export async function saveSongThumbnail(storageKey: string, buffer: Buffer): Promise<void> {
  await mkdir(THUMBNAILS_ROOT, { recursive: true });
  await writeFile(path.join(THUMBNAILS_ROOT, storageKey), buffer);
}

export async function readSongThumbnail(storageKey: string): Promise<Buffer> {
  return readFile(path.join(THUMBNAILS_ROOT, storageKey));
}

export function newThumbnailStorageKey(generationId: string): string {
  return `${generationId}.jpg`;
}
