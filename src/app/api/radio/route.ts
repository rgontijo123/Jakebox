import { NextResponse } from "next/server";
import { getRadioProgramme, positionAt } from "@/lib/radio";

export const dynamic = "force-dynamic";

/** Public programme of Rádio Jakebox plus the server clock, so players can
 * sync to the shared "live" position even if the visitor's clock is off. */
export async function GET() {
  const items = await getRadioProgramme();
  const now = Date.now();
  return NextResponse.json({ now, items, ...positionAt(items, now) }, { headers: { "Cache-Control": "no-store" } });
}
