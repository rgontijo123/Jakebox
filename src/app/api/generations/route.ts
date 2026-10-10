import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { moderateGenerationRequest } from "@/lib/moderation";
import { chargeForGeneration, refundForGeneration, CREDITS_PER_GENERATION, MAX_GENERATION_SECONDS } from "@/lib/credits";
import { generateMusic, MusicGenerationError } from "@/lib/musicProvider";
import { generateWithReference, generateWithPersona } from "@/lib/musicapi";
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
import { normalizeLyricsTags, normalizeLyricsPunctuation, deriveFallbackTitle } from "@/lib/lyrics";
import { generateSongVideo } from "@/lib/video";
import { generateCoverArt } from "@/lib/coverArt";
import { publishTempPublicUrl, cleanupTempPublicUrl } from "@/lib/publicHost";

const DAILY_GENERATION_LIMIT = 10;
const MAX_VERSIONS = 2;

const PAGE_SIZE = 10;

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const search = url.searchParams.get("search")?.trim();

  const where = {
    userId: session.user.id,
    ...(search
      ? {
          OR: [
            { stylePrompt: { contains: search, mode: "insensitive" as const } },
            { songs: { some: { title: { contains: search, mode: "insensitive" as const }, deletedAt: null } } },
          ],
        }
      : {}),
  };

  const [generations, total] = await Promise.all([
    db.generation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { songs: { where: { deletedAt: null } } },
    }),
    db.generation.count({ where }),
  ]);

  return NextResponse.json({
    total,
    page,
    pageSize: PAGE_SIZE,
    generations: generations.map((g) => {
      const song = g.songs[0];
      return {
        id: g.id,
        batchId: g.batchId,
        status: g.status,
        stylePrompt: g.stylePrompt,
        lyricsText: g.lyricsText,
        language: g.language,
        errorMessage: g.errorMessage,
        createdAt: g.createdAt.toISOString(),
        song: song
          ? {
              id: song.id,
              title: song.title,
              durationSeconds: song.durationSeconds,
              wordTimestamps: song.wordTimestamps,
              hasVideo: !!song.videoUrl,
              hasThumbnail: !!song.thumbnailUrl,
            }
          : null,
      };
    }),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const userId = session.user.id;
  const userRole = (session.user as { role?: string }).role;
  const isStaff = userRole === "owner" || userRole === "admin";

  const body = await req.json().catch(() => null);
  const stylePrompt = (body?.stylePrompt as string | undefined)?.trim();
  const instrumental = Boolean(body?.instrumental);
  const language = (body?.language as string | undefined) ?? "en";
  const lyricsText = normalizeLyricsTags(
    normalizeLyricsPunctuation(((body?.lyricsText as string | undefined) ?? "").trim()),
  );
  const targetDurationSeconds = Math.min(
    Math.max(Number(body?.targetDurationSeconds) || 60, 10),
    MAX_GENERATION_SECONDS,
  );
  const referenceSongId = (body?.referenceSongId as string | undefined) || undefined;
  const voicePersonaId = (body?.voicePersonaId as string | undefined) || undefined;
  // Both routes to a specific MusicAPI call rather than the multi-provider
  // fallback chain -- only one at a time for now, and no A/B versions
  // (each is already a heavier, more expensive call than a plain generation).
  const versions =
    referenceSongId || voicePersonaId
      ? 1
      : Math.min(Math.max(Number(body?.versions) || 1, 1), MAX_VERSIONS);

  if (!stylePrompt) {
    return NextResponse.json({ error: "Style prompt is required" }, { status: 400 });
  }
  if (!instrumental && !lyricsText) {
    return NextResponse.json({ error: "Add some lyrics, or mark as instrumental" }, { status: 400 });
  }
  if (referenceSongId && voicePersonaId) {
    return NextResponse.json({ error: "Use a reference song or a voice, not both" }, { status: 400 });
  }

  let referenceSong: { id: string; audioUrl: string; format: string } | null = null;
  if (referenceSongId) {
    const song = await db.song.findUnique({ where: { id: referenceSongId } });
    if (!song || song.deletedAt || (song.userId !== userId && !isStaff)) {
      return NextResponse.json({ error: "Reference song not found" }, { status: 404 });
    }
    referenceSong = { id: song.id, audioUrl: song.audioUrl, format: song.format };
  }

  let resolvedPersonaId: string | null = null;
  if (voicePersonaId) {
    const persona = await db.voicePersona.findUnique({ where: { id: voicePersonaId } });
    if (!persona || persona.userId !== userId) {
      return NextResponse.json({ error: "Voice not found" }, { status: 404 });
    }
    if (persona.status !== "ready" || !persona.personaId) {
      return NextResponse.json({ error: "This voice isn't ready yet" }, { status: 400 });
    }
    resolvedPersonaId = persona.personaId;
  }

  if (!isStaff) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await db.generation.count({ where: { userId, createdAt: { gte: since } } });
    if (recentCount + versions > DAILY_GENERATION_LIMIT) {
      return NextResponse.json({ error: "Daily generation limit reached, try again tomorrow" }, { status: 429 });
    }
  }

  const moderation = await moderateGenerationRequest({ stylePrompt, lyricsText });

  const batchId = randomUUID();
  const creditsPerVersion = CREDITS_PER_GENERATION;

  const generationIds: string[] = [];
  for (let i = 0; i < versions; i++) {
    const generation = await db.generation.create({
      data: {
        batchId,
        userId,
        status: moderation.flagged ? "rejected_moderation" : "pending",
        stylePrompt,
        instrumental,
        language,
        lyricsText,
        targetDurationSeconds,
      },
    });
    generationIds.push(generation.id);

    await db.moderationLog.create({
      data: {
        generationId: generation.id,
        userId,
        stage: moderation.stage === "none" ? "openai_moderation" : moderation.stage,
        flagged: moderation.flagged,
        categories: moderation.categories ?? undefined,
        action: moderation.flagged ? "blocked" : "allowed",
      },
    });
  }

  if (moderation.flagged) {
    return NextResponse.json(
      { error: "This request was rejected by our content policy.", batchId },
      { status: 422 },
    );
  }

  // charge for all versions up front; refund per-generation on shortfall/failure.
  // Owner/admin accounts skip this entirely -- Jakebox's credit balance is our
  // own internal bookkeeping toward eventually billing end users via Stripe,
  // not something that should ever block the people running the product.
  // Real cost still lands on the underlying provider account regardless of this.
  if (!isStaff) {
    try {
      for (const generationId of generationIds) {
        await chargeForGeneration(userId, generationId, creditsPerVersion);
      }
    } catch {
      // roll back any generations we did manage to charge, and fail the rest
      for (const generationId of generationIds) {
        await db.generation.update({
          where: { id: generationId },
          data: { status: "failed", errorMessage: "Insufficient credits" },
        });
      }
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
    }
  }

  await db.generation.updateMany({
    where: { id: { in: generationIds } },
    data: { status: "processing", creditsCharged: isStaff ? 0 : creditsPerVersion },
  });

  for (const generationId of generationIds) {
    runGenerationJob(generationId, userId, isStaff, {
      stylePrompt,
      lyricsText,
      instrumental,
      targetDurationSeconds,
      language,
      referenceSong,
      personaId: resolvedPersonaId,
    }).catch((err) => console.error("Background generation job crashed", err));
  }

  return NextResponse.json({ batchId });
}

async function runGenerationJob(
  generationId: string,
  userId: string,
  isStaff: boolean,
  params: {
    stylePrompt: string;
    lyricsText: string;
    instrumental: boolean;
    targetDurationSeconds: number;
    language: string;
    referenceSong: { id: string; audioUrl: string; format: string } | null;
    personaId: string | null;
  },
) {
  try {
    let result;
    if (params.personaId) {
      result = await generateWithPersona(params, params.personaId);
    } else if (params.referenceSong) {
      const refAudio = await readSongAudio(params.referenceSong.audioUrl);
      const refContentType = params.referenceSong.format === "wav" ? "audio/wav" : "audio/mpeg";
      const { publicUrl, objectKey } = await publishTempPublicUrl(
        refAudio,
        `ref-${params.referenceSong.id}.${params.referenceSong.format}`,
        refContentType,
      );
      try {
        result = await generateWithReference(params, publicUrl);
      } finally {
        await cleanupTempPublicUrl(objectKey);
      }
    } else {
      result = await generateMusic(params);
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
      const cover = await generateCoverArt({ title, styleSummary: params.stylePrompt });
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
    const message = err instanceof MusicGenerationError ? err.message : "Generation failed";
    const generation = await db.generation.findUniqueOrThrow({ where: { id: generationId } });
    await refundForGeneration(userId, generationId, generation.creditsCharged);
    await db.generation.update({
      where: { id: generationId },
      data: { status: "failed", errorMessage: message, creditsRefunded: generation.creditsCharged },
    });
  }
}
