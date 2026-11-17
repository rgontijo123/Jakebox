import { NextResponse, after } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isStaffRole } from "@/lib/staff";
import { generateRadioIntro, isRadioVoice } from "@/lib/radioIntro";
import { exactDurationMs } from "@/lib/exactDuration";
import { readSongAudio } from "@/lib/storage";

/** Staff-only: put a song on Rádio Jakebox ({ on: true }) or take it off.
 * Customer songs must have been made public by their creator first. Going
 * on air also generates the announcer intro in the background; taking it off
 * drops the intro, so off+on is how staff get a fresh one if it came out bad. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!isStaffRole((session?.user as { role?: string } | undefined)?.role)) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const on = Boolean(body?.on);
  // { on: true, newIntro: true, voice?: "female" | ... } re-records the intro
  // (optionally in another announcer's voice) without moving the song.
  const newIntro = on && Boolean(body?.newIntro);
  const voice = isRadioVoice(body?.voice) ? body.voice : undefined;
  // { on: true, noIntro: true } puts the song on air without spending a
  // MusicAPI generation on its announcer intro (e.g. when credits are low);
  // a later { on: true, newIntro: true } records it.
  const noIntro = Boolean(body?.noIntro);
  const song = await db.song.findUnique({ where: { id }, include: { user: { select: { role: true } } } });
  if (!song || song.deletedAt) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (on && !song.isPublic && !isStaffRole(song.user.role)) {
    return NextResponse.json({ error: "The creator hasn't made this song public" }, { status: 409 });
  }
  const updated = await db.song.update({
    where: { id },
    data: on
      ? { radioAt: song.radioAt ?? new Date(), ...(newIntro ? { radioIntroKey: null, radioIntroMs: null } : {}) }
      : { radioAt: null, radioIntroKey: null, radioIntroMs: null, radioVoice: null },
  });
  if (on && !noIntro && !updated.radioIntroKey) after(() => generateRadioIntro(id, voice));
  if (on && updated.radioDurationMs == null) {
    after(async () => {
      const ms = await exactDurationMs(await readSongAudio(updated.audioUrl)).catch(() => null);
      if (ms) await db.song.update({ where: { id }, data: { radioDurationMs: ms } });
    });
  }
  return NextResponse.json({ onRadio: !!updated.radioAt });
}
