import { NextResponse, after } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isStaffRole } from "@/lib/staff";
import { generateRadioIntro } from "@/lib/radioIntro";

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
  const on = Boolean((await req.json().catch(() => null))?.on);
  const song = await db.song.findUnique({ where: { id }, include: { user: { select: { role: true } } } });
  if (!song || song.deletedAt) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (on && !song.isPublic && !isStaffRole(song.user.role)) {
    return NextResponse.json({ error: "The creator hasn't made this song public" }, { status: 409 });
  }
  const updated = await db.song.update({ where: { id }, data: on ? { radioAt: song.radioAt ?? new Date() } : { radioAt: null, radioIntroKey: null, radioIntroMs: null },
  });
  if (on && !updated.radioIntroKey) after(() => generateRadioIntro(id));
  return NextResponse.json({ onRadio: !!updated.radioAt });
}
