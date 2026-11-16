import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isStaffRole } from "@/lib/staff";

/** The song's creator shows it on / hides it from the public /explore page.
 * Hiding a customer's song also takes it off the radio. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await params;
  const on = Boolean((await req.json().catch(() => null))?.on);
  const song = await db.song.findUnique({ where: { id } });
  if (!song || song.deletedAt || song.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const staffOwned = isStaffRole((session.user as { role?: string }).role);
  const updated = await db.song.update({
    where: { id },
    data: on
      ? { isPublic: true, publicAt: song.publicAt ?? new Date() }
      : { isPublic: false, ...(staffOwned ? {} : { radioAt: null }) },
  });
  return NextResponse.json({ isPublic: updated.isPublic, onRadio: !!updated.radioAt });
}
