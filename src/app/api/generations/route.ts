import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { moderateGenerationRequest } from "@/lib/moderation";
import { chargeForGeneration, refundForGeneration, secondsToCredits, MAX_GENERATION_SECONDS } from "@/lib/credits";
import { generateMusic, ElevenLabsError, type LyricSection } from "@/lib/elevenlabs";
import { getAudioDurationSeconds } from "@/lib/audio";
import { saveSongAudio, newStorageKey } from "@/lib/storage";

const DAILY_GENERATION_LIMIT = 10;

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
  const lyricsSections = (body?.lyricsSections as LyricSection[] | undefined) ?? [];
  const targetDurationSeconds = Math.min(
    Math.max(Number(body?.targetDurationSeconds) || 60, 10),
    MAX_GENERATION_SECONDS,
  );

  if (!stylePrompt) {
    return NextResponse.json({ error: "Style prompt is required" }, { status: 400 });
  }
  if (!instrumental && lyricsSections.length === 0) {
    return NextResponse.json({ error: "Add at least one lyrics section, or mark as instrumental" }, { status: 400 });
  }

  // Rate limit: block a compromised/abusive account from mass-generating.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentCount = await db.generation.count({ where: { userId, createdAt: { gte: since } } });
  if (recentCount >= DAILY_GENERATION_LIMIT) {
    return NextResponse.json({ error: "Daily generation limit reached, try again tomorrow" }, { status: 429 });
  }

  const lyricsText = lyricsSections.map((s) => s.text).join("\n");
  const moderation = await moderateGenerationRequest({ stylePrompt, lyricsText });

  const generation = await db.generation.create({
    data: {
      userId,
      status: moderation.flagged ? "rejected_moderation" : "pending",
      stylePrompt,
      instrumental,
      language,
      lyricsSections: lyricsSections as unknown as object,
      targetDurationSeconds,
    },
  });

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

  if (moderation.flagged) {
    return NextResponse.json(
      { error: "This request was rejected by our content policy.", generationId: generation.id },
      { status: 422 },
    );
  }

  const credits = secondsToCredits(targetDurationSeconds);
  try {
    await chargeForGeneration(userId, generation.id, credits);
  } catch {
    await db.generation.update({ where: { id: generation.id }, data: { status: "failed", errorMessage: "Insufficient credits" } });
    return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
  }

  await db.generation.update({
    where: { id: generation.id },
    data: { status: "processing", creditsCharged: credits },
  });

  // NOTE: fire-and-forget in-process background work. This is fine for
  // `npm run dev` (long-lived Node process) but will NOT survive on Vercel's
  // serverless runtime, which can freeze/kill the function after the
  // response is sent. Before deploying to production, swap this call for a
  // real background job (Inngest), per the architecture plan.
  runGenerationJob(generation.id, userId, {
    stylePrompt,
    lyricsSections,
    instrumental,
    targetDurationSeconds,
  }).catch((err) => console.error("Background generation job crashed", err));

  return NextResponse.json({ generationId: generation.id });
}

async function runGenerationJob(
  generationId: string,
  userId: string,
  params: { stylePrompt: string; lyricsSections: LyricSection[]; instrumental: boolean; targetDurationSeconds: number },
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
        title: params.stylePrompt.slice(0, 80),
        audioUrl: storageKey,
        format: result.format,
        durationSeconds: actualDurationSeconds,
        fileSizeBytes: result.audio.byteLength,
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
