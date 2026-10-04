import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { moderateGenerationRequest } from "@/lib/moderation";
import { getAudioDurationSeconds, transcodeToMp3 } from "@/lib/audio";
import { saveSongAudio, newStorageKey } from "@/lib/storage";

const MAX_UPLOAD_BYTES = 30 * 1024 * 1024; // 30MB -- generous for a song-length mp3/wav

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const userId = session.user.id;

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });

  const file = form.get("audio");
  const title = (form.get("title") as string | null)?.trim();
  const language = (form.get("language") as string | null) ?? "en";
  const stylePrompt = (form.get("stylePrompt") as string | null)?.trim() || "Uploaded audio";
  const lyricsText = (form.get("lyricsText") as string | null)?.trim() ?? "";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Audio file is required" }, { status: 400 });
  }
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "The uploaded file is empty" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File is too large (max 30MB)" }, { status: 400 });
  }

  const moderation = await moderateGenerationRequest({ stylePrompt, lyricsText });
  if (moderation.flagged) {
    return NextResponse.json({ error: "This request was rejected by our content policy." }, { status: 422 });
  }

  const rawBuffer = Buffer.from(await file.arrayBuffer());

  let mp3Buffer: Buffer;
  try {
    mp3Buffer = await transcodeToMp3(rawBuffer);
  } catch {
    return NextResponse.json({ error: "Couldn't read that audio file -- is it a valid audio format?" }, { status: 400 });
  }

  const durationSeconds = await getAudioDurationSeconds(mp3Buffer, "mp3");

  const generation = await db.generation.create({
    data: {
      batchId: randomUUID(),
      userId,
      status: "completed",
      stylePrompt,
      instrumental: !lyricsText,
      language,
      lyricsText,
      targetDurationSeconds: durationSeconds || 1,
      actualDurationSeconds: durationSeconds,
      completedAt: new Date(),
    },
  });

  const storageKey = newStorageKey(generation.id, "mp3");
  await saveSongAudio(storageKey, mp3Buffer);

  const song = await db.song.create({
    data: {
      generationId: generation.id,
      userId,
      title,
      audioUrl: storageKey,
      format: "mp3",
      durationSeconds,
      fileSizeBytes: mp3Buffer.byteLength,
      provider: "upload",
    },
  });

  return NextResponse.json({ batchId: generation.batchId, songId: song.id });
}
