import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { transcodeToMp3 } from "@/lib/audio";
import { publishTempPublicUrl, cleanupTempPublicUrl, PublicHostUnavailableError } from "@/lib/publicHost";
import { createVoicePersona, MusicApiError } from "@/lib/musicapi";

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20MB -- generous for a <=60s recording

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const personas = await db.voicePersona.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    personas: personas.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      errorMessage: p.errorMessage,
    })),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });

  const file = form.get("audio");
  const name = (form.get("name") as string | null)?.trim();

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Audio recording is required" }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: "Give this voice a name" }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "The recording is empty" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Recording is too large (max 20MB)" }, { status: 400 });
  }

  const rawBuffer = Buffer.from(await file.arrayBuffer());

  let mp3Buffer: Buffer;
  try {
    mp3Buffer = await transcodeToMp3(rawBuffer);
  } catch {
    return NextResponse.json({ error: "Couldn't read that recording -- try recording again" }, { status: 400 });
  }

  const persona = await db.voicePersona.create({
    data: { userId: session.user.id, name, status: "pending" },
  });

  // Cloning takes 1-3 minutes on MusicAPI's side -- answer now and finish in
  // the background (same pattern as song generation), so the recorder can
  // close instead of hanging on one long request. The client polls GET.
  void finishVoicePersona(persona.id, mp3Buffer);
  return NextResponse.json({ persona: { id: persona.id, name, status: "pending" } }, { status: 202 });
}

async function finishVoicePersona(voicePersonaId: string, mp3Buffer: Buffer) {
  let objectKey: string | undefined;
  try {
    // MusicAPI's create-voice needs a >10s, single-speaker MP3/WAV at a
    // PUBLIC url -- it fetches the audio itself, it doesn't take a direct
    // upload. Host it temporarily on the same R2 bucket the Musicas
    // project already uses for this exact problem (see publicHost.ts).
    const { publicUrl, objectKey: key } = await publishTempPublicUrl(mp3Buffer, `${voicePersonaId}.mp3`, "audio/mpeg");
    objectKey = key;

    const { personaId } = await createVoicePersona(publicUrl);

    await db.voicePersona.update({ where: { id: voicePersonaId }, data: { status: "ready", personaId } });
  } catch (err) {
    // createVoicePersona (musicapi.ts) was never confirmed against a real
    // response before this -- logging the raw error here (not just the
    // sanitized message sent to the client) is what makes a real schema
    // mismatch diagnosable instead of a silent generic failure.
    console.error("Voice persona creation failed", err);
    const message =
      err instanceof MusicApiError || err instanceof PublicHostUnavailableError
        ? err.message
        : err instanceof Error
          ? `Voice creation failed: ${err.message}`
          : "Voice creation failed";
    await db.voicePersona.update({ where: { id: voicePersonaId }, data: { status: "failed", errorMessage: message } });
  } finally {
    if (objectKey) await cleanupTempPublicUrl(objectKey);
  }
}
