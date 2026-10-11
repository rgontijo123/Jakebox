import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// Lets client components (GenerationForm's cost estimate) know the current
// balance without going through a full server-rendered page -- same
// unlimited-for-owner/admin treatment as CreditBadge/the billing page.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { creditBalance: true, role: true },
  });

  const unlimited = user?.role === "owner" || user?.role === "admin";
  return NextResponse.json({
    creditBalance: Math.max(0, user?.creditBalance ?? 0),
    unlimited,
  });
}
