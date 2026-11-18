import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { moderateGenerationRequest } from "@/lib/moderation";
import { chargeForGeneration, refundForGeneration, creditsForDuration, MAX_GENERATION_SECONDS } from "@/lib/credits";
import { runGenerationJob, startHeartbeat, type GenerationJobParams } from "@/lib/generationJob";
import { normalizeLyricsTags, normalizeLyricsPunctuation } from "@/lib/lyrics";

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

  const role = (session.user as { role?: string }).role;
  return NextResponse.json({
    total,
    page,
    pageSize: PAGE_SIZE,
    canManageRadio: role === "owner" || role === "admin",
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
              onRadio: !!song.radioAt,
              isPublic: song.isPublic,
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
  const creditsPerVersion = creditsForDuration(targetDurationSeconds);

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

  // charge for all versions up front (trial/plan songs first, then credits);
  // refund per-generation on shortfall/failure. Owner/admin accounts skip
  // this entirely -- real provider cost still lands on the provider account.
  if (!isStaff) {
    const charged: string[] = [];
    try {
      for (const generationId of generationIds) {
        await chargeForGeneration(userId, generationId, creditsPerVersion);
        charged.push(generationId);
      }
    } catch {
      // give back what the earlier versions in this batch already took, and fail them all
      for (const generationId of charged) {
        await refundForGeneration(userId, generationId);
      }
      await db.generation.updateMany({
        where: { id: { in: generationIds } },
        data: { status: "failed", errorMessage: "Insufficient credits" },
      });
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
    }
  }

  const jobParams: GenerationJobParams = {
    stylePrompt,
    lyricsText,
    instrumental,
    targetDurationSeconds,
    language,
    referenceSong,
    personaId: resolvedPersonaId,
  };
  await db.generation.updateMany({
    where: { id: { in: generationIds } },
    data: {
      status: "processing",
      jobHeartbeatAt: new Date(),
      jobParams: { referenceSong, personaId: resolvedPersonaId },
    },
  });

  // Chained, not fired in parallel: each runGenerationJob call also does
  // cover-art generation (coverArt.ts) and video rendering (video.ts) --
  // real ffmpeg/image work on this same Node process, not just an external
  // API call. Two versions running those steps at once roughly doubles
  // peak memory, which was enough to OOM-crash the instance (same failure
  // mode as the music_lab service before its Whisper model was downsized).
  // Running them one after another keeps peak memory to one generation's
  // worth, at the cost of the second version finishing later.
  (async () => {
    // Versions still queued behind the first are kept alive too, so the
    // recovery sweep doesn't start them a second time.
    const stop = startHeartbeat(generationIds);
    try {
      for (const generationId of generationIds) {
        try {
          await runGenerationJob(generationId, userId, jobParams);
        } catch (err) {
          console.error("Background generation job crashed", err);
        }
      }
    } finally {
      stop();
    }
  })();

  return NextResponse.json({ batchId });
}
