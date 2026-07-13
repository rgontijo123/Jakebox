import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "owner" && session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const target = await db.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (target.role === "owner") {
    return NextResponse.json({ error: "Can't ban the owner" }, { status: 400 });
  }

  const newStatus = target.status === "banned" ? "active" : "banned";
  await db.user.update({ where: { id }, data: { status: newStatus } });

  return NextResponse.json({ ok: true, status: newStatus });
}
