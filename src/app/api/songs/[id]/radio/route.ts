import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

/** Staff-only: put a song on Rádio Jakebox ({ on: true }) or take it off. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "owner" && role !== "admin") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  const { id } = await params;
  const on = Boolean((await req.json().catch(() => null))?.on);
  const song = await db.song.findUnique({ where: { id } });
  if (!song || song.deletedAt) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const updated = await db.song.update({ where: { id }, data: { radioAt: on ? (song.radioAt ?? new Date()) : null } });
  return NextResponse.json({ onRadio: !!updated.radioAt });
}
