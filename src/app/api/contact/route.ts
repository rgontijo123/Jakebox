import { NextResponse } from "next/server";
import { sendContactEmail } from "@/lib/email";

const LIMITS = { name: 120, email: 200, phone: 40, city: 120, country: 120, message: 5000 };
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;
// Per-instance, best-effort flood guard -- resets on deploy, which is fine
// for a contact form.
const recent = new Map<string, number[]>();

function field(body: Record<string, unknown> | null, key: keyof typeof LIMITS) {
  const value = typeof body?.[key] === "string" ? (body[key] as string).trim() : "";
  return value.slice(0, LIMITS[key]);
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;

  // Honeypot: a field hidden from people that bots tend to fill in.
  if (typeof body?.website === "string" && body.website.trim()) {
    return NextResponse.json({ ok: true });
  }

  const msg = {
    name: field(body, "name"),
    email: field(body, "email"),
    phone: field(body, "phone"),
    city: field(body, "city") || undefined,
    country: field(body, "country") || undefined,
    message: field(body, "message"),
  };
  if (!msg.name || !msg.phone || !msg.message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(msg.email)) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= MAX_PER_WINDOW) {
    return NextResponse.json({ error: "too_many" }, { status: 429 });
  }
  recent.set(ip, [...hits, now]);

  const sent = await sendContactEmail(msg);
  if (!sent) {
    return NextResponse.json({ error: "send_failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
