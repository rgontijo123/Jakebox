import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const MAX_NAME_LENGTH = 60;
const MAX_PROMPT_LENGTH = 500;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const presets = await db.stylePreset.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    presets: presets.map((p) => ({ id: p.id, name: p.name, prompt: p.prompt })),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const name = (body?.name as string | undefined)?.trim().slice(0, MAX_NAME_LENGTH);
  const prompt = (body?.prompt as string | undefined)?.trim().slice(0, MAX_PROMPT_LENGTH);

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!prompt) return NextResponse.json({ error: "Style prompt is required" }, { status: 400 });

  const preset = await db.stylePreset.create({
    data: { userId: session.user.id, name, prompt },
  });

  return NextResponse.json({ preset: { id: preset.id, name: preset.name, prompt: preset.prompt } });
}
