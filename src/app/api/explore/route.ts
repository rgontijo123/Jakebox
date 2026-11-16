import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isStaffRole } from "@/lib/staff";
import { isNational } from "@/lib/radio";

const PAGE_SIZE = 24;

/** Public songs for /explore: most voted (default) or newest. */
export async function GET(req: Request) {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const canManageRadio = isStaffRole((session?.user as { role?: string } | undefined)?.role);
  const url = new URL(req.url);
  const sort = url.searchParams.get("sort") === "new" ? "new" : "top";
  const filter = url.searchParams.get("filter"); // "national" | "international" | null
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);

  const where = {
    isPublic: true,
    deletedAt: null,
    ...(filter === "national"
      ? { generation: { language: { startsWith: "pt" } } }
      : filter === "international"
        ? { generation: { NOT: { language: { startsWith: "pt" } } } }
        : {}),
  };
  const [songs, total] = await Promise.all([
    db.song.findMany({
      where,
      orderBy: sort === "new" ? [{ publicAt: "desc" }] : [{ votes: { _count: "desc" } }, { publicAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        title: true,
        durationSeconds: true,
        thumbnailUrl: true,
        radioAt: true,
        generation: { select: { stylePrompt: true, language: true } },
        _count: { select: { votes: true } },
        ...(userId ? { votes: { where: { userId }, select: { id: true } } } : {}),
      },
    }),
    db.song.count({ where }),
  ]);

  return NextResponse.json(
    {
      total,
      page,
      pageSize: PAGE_SIZE,
      signedIn: !!userId,
      canManageRadio,
      songs: songs.map((s) => ({
        id: s.id,
        title: s.title,
        style: s.generation.stylePrompt.split(/[,.;]/)[0]?.trim().slice(0, 60) ?? "",
        national: isNational(s.generation.language),
        durationSeconds: s.durationSeconds,
        cover: s.thumbnailUrl ? `/api/radio/cover/${s.id}` : null,
        audio: `/api/radio/audio/${s.id}`,
        votes: s._count.votes,
        voted: "votes" in s && Array.isArray(s.votes) && s.votes.length > 0,
        onRadio: !!s.radioAt,
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
