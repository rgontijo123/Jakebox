import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { moderateGenerationRequest } from "@/lib/moderation";
import { chargeForGeneration, refundForGeneration, secondsToCredits, MAX_GENERATION_SECONDS } from "@/lib/credits";
import { generateMusic, ElevenLabsError } from "@/lib/elevenlabs";
import { getAudioDurationSeconds } from "@/lib/audio";
import { saveSongAudio, newStorageKey } from "@/lib/storage";

const DAILY_GENERATION_LIMIT = 10;
const MAX_VERSIONS = 2;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const generations = await db.generation.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { songs: { where: { deletedAt: null } } },
  });

  return NextResponse.json({
    generations: generations.map((g) => {
      const song = g.songs[0];
      return {
        id: g.id,
        batchId: g.batchId,
        status: g.status,
        stylePrompt: g.stylePrompt,
        lyricsText: g.lyricsText,
        errorMessage: g.errorMessage,
        createdAt: g.createdAt.toISOString(),
        song: song
          ? {
              id: song.id,
              title: song.title,
              durationSeconds: song.durationSeconds,
              wordTimestamps: song.wordTimestamps,
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

  const body = await req.json().catch(() => null);
  const stylePrompt = (body?.stylePrompt as string | undefined)?.trim();
  const instrumental = Boolean(body?.instrumental);
  const language = (body?.language as string | undefined) ?? "en";
  const lyricsText = ((body?.lyricsText as string | undefined) ?? "").trim();
  const targetDurationSeconds = Math.min(
    Math.max(Number(body?.targetDurationSeconds) || 60, 10),
    MAX_GENERATION_SECONDS,
  );
  const versions = Math.min(Math.max(Number(body?.versions) || 1, 1), MAX_VERSIONS);

  if (!stylePrompt) {
    return NextResponse.json({ error: "Style prompt is required" }, { status: 400 });
  }
  if (!instrumental && !lyricsText) {
    return NextResponse.json({ error: "Add some lyrics, or mark as instrumental" }, { status: 400 });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentCount = await db.generation.count({ where: { userId, createdAt: { gte: since } } });
  if (recentCount + versions > DAILY_GENERATION_LIMIT) {
    return NextResponse.json({ error: "Daily generation limit reached, try again tomorrow" }, { status: 429 });
  }

  const moderation = await moderateGenerationRequest({ stylePrompt, lyricsText });

  const batchId = randomUUID();
  const creditsPerVersion = secondsToCredits(targetDurationSeconds);

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

  // charge for all versions up front; refund per-generation on shortfall/failure
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

  await db.generation.updateMany({
    where: { id: { in: generationIds } },
    data: { status: "processing", creditsCharged: creditsPerVersion },
  });

  for (const generationId of generationIds) {
    runGenerationJob(generationId, userId, {
      stylePrompt,
      lyricsText,
      instrumental,
      targetDurationSeconds,
      language,
    }).catch((err) => console.error("Background generation job crashed", err));
  }

  return NextResponse.json({ batchId });
}

async function runGenerationJob(
  generationId: string,
  userId: string,
  params: {
    stylePrompt: string;
    lyricsText: string;
    instrumental: boolean;
    targetDurationSeconds: number;
    language: string;
  },
) {
  try {
    const result = await generateMusic(params);
    const actualDurationSeconds = await getAudioDurationSeconds(result.audio);

    const storageKey = newStorageKey(generationId, result.format);
    await saveSongAudio(storageKey, result.audio);

    await db.song.create({
      data: {
        generationId,
        userId,
        title: result.title ?? params.stylePrompt.slice(0, 80),
        audioUrl: storageKey,
        format: result.format,
        durationSeconds: actualDurationSeconds,
        fileSizeBytes: result.audio.byteLength,
        wordTimestamps: result.wordTimestamps.length
          ? (result.wordTimestamps as unknown as object[])
          : undefined,
      },
    });

    const chargedCredits = secondsToCredits(params.targetDurationSeconds);
    const actualCredits = secondsToCredits(actualDurationSeconds);
    const refund = Math.max(0, chargedCredits - actualCredits);
    if (refund > 0) {
      await refundForGeneration(userId, generationId, refund);
    }

    await db.generation.update({
      where: { id: generationId },
      data: {
        status: "completed",
        actualDurationSeconds,
        creditsRefunded: refund,
        completedAt: new Date(),
      },
    });
  } catch (err) {
    const message = err instanceof ElevenLabsError ? err.message : "Generation failed";
    const generation = await db.generation.findUniqueOrThrow({ where: { id: generationId } });
    await refundForGeneration(userId, generationId, generation.creditsCharged);
    await db.generation.update({
      where: { id: generationId },
      data: { status: "failed", errorMessage: message, creditsRefunded: generation.creditsCharged },
    });
  }
}
