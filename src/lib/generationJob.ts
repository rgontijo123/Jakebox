/** The background part of a song generation: provider call, storage, cover
 * art, video. Runs inside the web process, so it also has to survive that
 * process restarting (every deploy) -- see recoverInterruptedGenerations. */

import { db } from "@/lib/db";
import { refundForGeneration } from "@/lib/credits";
import { generateMusic, MusicGenerationError } from "@/lib/musicProvider";
import { generateWithReference, generateWithPersona, resumeMusicApiTask } from "@/lib/musicapi";
import { getAudioDurationSeconds } from "@/lib/audio";
import {
  saveSongAudio,
  newStorageKey,
  saveSongVideo,
  newVideoStorageKey,
  saveSongThumbnail,
  newThumbnailStorageKey,
  readSongAudio,
} from "@/lib/storage";
import { deriveFallbackTitle } from "@/lib/lyrics";
import { generateSongVideo } from "@/lib/video";
import { generateCoverArt } from "@/lib/coverArt";
import { publishTempPublicUrl, cleanupTempPublicUrl } from "@/lib/publicHost";

export type GenerationJobParams = {
  stylePrompt: string;
  lyricsText: string;
  instrumental: boolean;
  targetDurationSeconds: number;
  language: string;
  referenceSong: { id: string; audioUrl: string; format: string } | null;
  personaId: string | null;
};

const HEARTBEAT_MS = 30_000;
/** A job whose heartbeat is older than this has no live process behind it. */
const STALE_AFTER_MS = 2 * 60_000;
/** Past this, stop retrying and give the credits back. */
const GIVE_UP_AFTER_MS = 3 * 60 * 60_000;

/** Keeps the jobs' heartbeat fresh while this process is working on them
 * (including versions still queued behind the first one). */
export function startHeartbeat(generationIds: string[]): () => void {
  const beat = () =>
    db.generation
      .updateMany({ where: { id: { in: generationIds }, status: "processing" }, data: { jobHeartbeatAt: new Date() } })
      .catch((err) => console.error("[generation] heartbeat failed", err));
  void beat();
  const timer = setInterval(beat, HEARTBEAT_MS);
  return () => clearInterval(timer);
}

let recovering = false;

/** Finds generations left "processing" by a process that died (heartbeat
 * gone stale) and finishes them here: a MusicAPI task that was already
 * accepted is polled again (it kept running and is already paid for);
 * a job that never reached a provider is started again. One at a time, like
 * the normal flow, to keep memory to one generation's worth. */
export async function recoverInterruptedGenerations(): Promise<void> {
  if (recovering) return;
  recovering = true;
  try {
    const now = Date.now();
    const stale = new Date(now - STALE_AFTER_MS);
    const candidates = await db.generation.findMany({
      where: {
        status: { in: ["pending", "processing"] },
        OR: [{ jobHeartbeatAt: { lt: stale } }, { jobHeartbeatAt: null, createdAt: { lt: new Date(now - 10 * 60_000) } }],
      },
      orderBy: { createdAt: "asc" },
    });
    if (candidates.length) console.log(`[generation] ${candidates.length} interrupted generation(s) to recover`);
    for (const g of candidates) {
      // Claim it: only one process may take over a given job.
      const claimed = await db.generation.updateMany({
        where: {
          id: g.id,
          status: { in: ["pending", "processing"] },
          OR: [{ jobHeartbeatAt: null }, { jobHeartbeatAt: { lt: stale } }],
        },
        data: { status: "processing", jobHeartbeatAt: new Date() },
      });
      if (claimed.count !== 1) continue;

      const tooOld = now - g.createdAt.getTime() > GIVE_UP_AFTER_MS;
      const extra = (g.jobParams ?? {}) as Partial<GenerationJobParams>;
      const resumable = g.jobProvider === "musicapi" && !!g.jobTaskId;
      // Rows from before jobParams existed still carry everything a plain
      // (no reference song / voice) generation needs, so they restart too.
      if (tooOld) {
        await refundForGeneration(g.userId, g.id);
        await db.generation.update({ where: { id: g.id }, data: { status: "failed", errorMessage: "Interrupted" } });
        continue;
      }
      console.log(`[generation] recovering ${g.id} (${resumable ? `resuming task ${g.jobTaskId}` : "restarting"})`);
      const stop = startHeartbeat([g.id]);
      try {
        await runGenerationJob(
          g.id,
          g.userId,
          {
            stylePrompt: g.stylePrompt,
            lyricsText: g.lyricsText,
            instrumental: g.instrumental,
            targetDurationSeconds: g.targetDurationSeconds,
            language: g.language,
            referenceSong: extra.referenceSong ?? null,
            personaId: extra.personaId ?? null,
          },
          resumable ? g.jobTaskId : null,
        );
      } finally {
        stop();
      }
    }
  } catch (err) {
    console.error("[generation] recovery failed", err);
  } finally {
    recovering = false;
  }
}

export async function runGenerationJob(
  generationId: string,
  userId: string,
  params: GenerationJobParams,
  resumeTaskId?: string | null,
) {
  try {
    let result;
    // Remember the provider's task as soon as it exists, so a restart can
    // pick the job up instead of losing it (generationRecovery below).
    const withTask = {
      ...params,
      onTask: async (provider: string, taskId: string) => {
        await db.generation.update({ where: { id: generationId }, data: { jobProvider: provider, jobTaskId: taskId } });
      },
    };
    if (resumeTaskId) {
      result = {
        ...(await resumeMusicApiTask(resumeTaskId, deriveFallbackTitle(params.lyricsText, params.stylePrompt))),
        provider: "musicapi",
      };
    } else if (params.personaId) {
      result = await generateWithPersona(withTask, params.personaId);
    } else if (params.referenceSong) {
      const refAudio = await readSongAudio(params.referenceSong.audioUrl);
      const refContentType = params.referenceSong.format === "wav" ? "audio/wav" : "audio/mpeg";
      const { publicUrl, objectKey } = await publishTempPublicUrl(
        refAudio,
        `ref-${params.referenceSong.id}.${params.referenceSong.format}`,
        refContentType,
      );
      try {
        result = await generateWithReference(withTask, publicUrl);
      } finally {
        await cleanupTempPublicUrl(objectKey);
      }
    } else {
      result = await generateMusic(withTask);
    }
    const actualDurationSeconds = await getAudioDurationSeconds(result.audio, result.format);

    const storageKey = newStorageKey(generationId, result.format);
    await saveSongAudio(storageKey, result.audio);
    const title = result.title ?? deriveFallbackTitle(params.lyricsText, params.stylePrompt);

    const song = await db.song.create({
      data: {
        generationId,
        userId,
        title,
        audioUrl: storageKey,
        format: result.format,
        durationSeconds: actualDurationSeconds,
        fileSizeBytes: result.audio.byteLength,
        wordTimestamps: result.wordTimestamps.length
          ? (result.wordTimestamps as unknown as object[])
          : undefined,
        provider: result.provider,
      },
    });

    // Best-effort: an AI-generated cover matching the song's style, never a
    // reason to fail the generation itself (no GEMINI_API_KEY, quota, etc).
    // Takes priority over the waveform-video still-frame fallback below.
    let coverThumbnailKey: string | null = null;
    try {
      const cover = await generateCoverArt({
        title,
        styleSummary: params.stylePrompt,
        providerCoverUrl: result.coverImageUrl,
      });
      if (cover) {
        coverThumbnailKey = newThumbnailStorageKey(generationId);
        await saveSongThumbnail(coverThumbnailKey, cover);
        await db.song.update({ where: { id: song.id }, data: { thumbnailUrl: coverThumbnailKey } });
      }
    } catch (err) {
      console.error("Cover art generation failed (song itself still succeeded)", err);
    }
    // Best-effort: an automatic vertical video (waveform + title/style,
    // see src/lib/video.ts) is a nice-to-have on top of the song, never a
    // reason to fail the generation itself if ffmpeg has a bad day.
    try {
      const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
      const { video, thumbnail } = await generateSongVideo({
        audio: result.audio,
        title,
        styleSummary: params.stylePrompt,
        authorName: user.displayName ?? user.email,
        language: params.language,
        lyricsText: params.lyricsText,
        wordTimestamps: result.wordTimestamps,
      });
      const videoKey = newVideoStorageKey(generationId);
      await saveSongVideo(videoKey, video);
      // Only fall back to the waveform-frame thumbnail when the AI cover
      // above didn't produce one -- the cover art always wins.
      if (coverThumbnailKey) {
        await db.song.update({ where: { id: song.id }, data: { videoUrl: videoKey } });
      } else {
        const fallbackThumbnailKey = newThumbnailStorageKey(generationId);
        await saveSongThumbnail(fallbackThumbnailKey, thumbnail);
        await db.song.update({
          where: { id: song.id },
          data: { videoUrl: videoKey, thumbnailUrl: fallbackThumbnailKey },
        });
      }
    } catch (err) {
      console.error("Video generation failed (song itself still succeeded)", err);
    }

    await db.generation.update({
      where: { id: generationId },
      data: {
        status: "completed",
        actualDurationSeconds,
        completedAt: new Date(),
      },
    });
  } catch (err) {
    // Same lesson as voice-personas' fix: swallowing the raw error here
    // (previously only ever surfacing err.message for a MusicGenerationError,
    // silently discarding everything else) left every other failure mode --
    // a provider schema mismatch, a bug in this file, anything from
    // cover-art/video generation that somehow escaped their own try/catch --
    // completely undiagnosable, showing only a bare "Generation failed" with
    // nothing logged anywhere to explain it.
    console.error("Generation job failed", generationId, err);
    const message =
      err instanceof MusicGenerationError
        ? err.message
        : err instanceof Error
          ? `Generation failed: ${err.message}`
          : "Generation failed";
    await refundForGeneration(userId, generationId);
    await db.generation.update({
      where: { id: generationId },
      data: { status: "failed", errorMessage: message },
    });
  }
}
