import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { grantAdminAdjustment } from "@/lib/credits";

/** Edit a user from the admin list: display name, included songs, and a
 * credit adjustment (+/-, recorded in the ledger like any other change). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "owner" && session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const target = await db.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const displayName = typeof body?.displayName === "string" ? body.displayName.trim().slice(0, 120) : undefined;
  const songQuota = body?.songQuota === undefined ? undefined : Number(body.songQuota);
  const creditDelta = body?.creditDelta === undefined ? 0 : Number(body.creditDelta);

  if (songQuota !== undefined && (!Number.isInteger(songQuota) || songQuota < 0 || songQuota > 1000)) {
    return NextResponse.json({ error: "songQuota must be a whole number from 0 to 1000" }, { status: 400 });
  }
  if (!Number.isInteger(creditDelta)) {
    return NextResponse.json({ error: "creditDelta must be a whole number" }, { status: 400 });
  }

  await db.user.update({
    where: { id },
    data: {
      ...(displayName !== undefined && { displayName: displayName || null }),
      ...(songQuota !== undefined && { songQuota }),
    },
  });
  if (creditDelta !== 0) await grantAdminAdjustment(id, creditDelta);

  const updated = await db.user.findUniqueOrThrow({
    where: { id },
    select: { displayName: true, songQuota: true, creditBalance: true },
  });
  return NextResponse.json({ ok: true, user: updated });
}
