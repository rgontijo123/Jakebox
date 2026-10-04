import { existsSync } from "node:fs";
import path from "node:path";
import { db } from "./db";

const VIDEOS_ROOT = path.join(process.cwd(), "storage", "videos");
const THUMBNAILS_ROOT = path.join(process.cwd(), "storage", "thumbnails");

/** The automatic video step (see /api/generations' runGenerationJob) writes
 * the video/thumbnail files to disk *before* linking them onto the Song row,
 * and runs unawaited in the background with no queue or retry. If the
 * process dies between those two steps -- a dev-server hot reload is the
 * common case, but a prod restart/redeploy at the wrong instant does the
 * same thing -- the files are stranded on disk forever with nothing
 * pointing at them, and the song is stuck looking video-less.
 *
 * This walks every video-less song, and for each one checks whether a video
 * (keyed by generationId, see storage.ts's newVideoStorageKey) already
 * exists on disk despite never getting linked -- if so, links it now rather
 * than leaving it orphaned. Cheap enough (a directory stat per candidate) to
 * run on every server start; see src/instrumentation.ts. */
export async function reconcileOrphanedVideos(): Promise<{ relinked: number; checked: number }> {
  const candidates = await db.song.findMany({
    where: { videoUrl: null, deletedAt: null },
    select: { id: true, generationId: true, title: true },
  });

  let relinked = 0;
  for (const song of candidates) {
    const videoKey = `${song.generationId}.mp4`;
    if (!existsSync(path.join(VIDEOS_ROOT, videoKey))) continue;

    const thumbnailKey = `${song.generationId}.jpg`;
    const hasThumbnail = existsSync(path.join(THUMBNAILS_ROOT, thumbnailKey));

    await db.song.update({
      where: { id: song.id },
      data: {
        videoUrl: videoKey,
        ...(hasThumbnail ? { thumbnailUrl: thumbnailKey } : {}),
      },
    });
    relinked++;
    console.log(`[videoReconcile] relinked orphaned video for "${song.title}" (${song.id})`);
  }

  return { relinked, checked: candidates.length };
}
