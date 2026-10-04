// Plain Node script (no tsx) that drives the real running Next.js dev
// server over HTTP -- this exercises the exact same code path real users
// hit, sidestepping a tsx/esbuild CJS-interop quirk that breaks
// music-metadata's `content-type` dependency when run standalone via tsx.
import { readFile } from "node:fs/promises";
import path from "node:path";

const BASE_URL = "http://localhost:3000";
const EMAIL = "test2@jakebox.dev";
const PASSWORD = "testpassword123";
const FOLDER = path.join(process.cwd(), "musicas de teste");

const SONGS = [
  { file: "Any Time You Need - Techno - Psy trance.txt", style: "Techno, Psy trance", language: "en" },
  { file: "Brisa da Manha by Fernando - Reggae, Brasil, Roots.txt", style: "Reggae, Brasil, Roots", language: "pt-BR" },
  { file: "Cobra - Sertanejo universitario - brasil pop.txt", style: "Sertanejo universitário, brasil pop", language: "pt-BR" },
  { file: "Dividendos - brasil - pagode - sertanjo.txt", style: "Brasil, pagode, sertanejo", language: "pt-BR" },
  { file: "Infinite Loop - techno, melodic.txt", style: "Techno, melodic", language: "en" },
  { file: "Manuela - pop brasileiro.txt", style: "Pop brasileiro", language: "en" },
  { file: "My moment - psytrance, drumbass, techno.txt", style: "Psytrance, drum and bass, techno", language: "en" },
  { file: "Not a Fairy Tale- hardcore rock, shaman style.txt", style: "Hardcore rock, shaman style", language: "en" },
  { file: "Quem é o X9 - reggae style, brasileiro, pop, hip hop.txt", style: "Reggae, brasileiro, pop, hip hop", language: "pt-BR" },
  { file: "Quem é o X9 extended - reggae sytle, brasileiro, pop, hip hop.txt", style: "Reggae, brasileiro, pop, hip hop", language: "pt-BR" },
  { file: "Rich people - techno, pop, melodic, male voice.txt", style: "Techno, pop, melodic, male voice", language: "en" },
  { file: "Saudade de um tempo - sertanejo, sofrencia.txt", style: "Sertanejo, sofrência", language: "pt-BR" },
  { file: "Wake Up - rock, pop, melodic, guitar solo, romantic rock.txt", style: "Rock, pop, melodic, guitar solo, romantic rock", language: "en" },
];

function recommendedDuration(lyricsText) {
  const words = lyricsText.trim() ? lyricsText.trim().split(/\s+/).filter(Boolean).length : 0;
  if (!words) return 60;
  return Math.min(300, Math.max(30, Math.ceil(words / 2.3) + 15));
}

function parseSetCookies(res) {
  const raw = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get("set-cookie")].filter(Boolean);
  return raw.map((c) => c.split(";")[0]);
}

function mergeCookies(jar, newCookies) {
  for (const c of newCookies) {
    const [name] = c.split("=");
    jar.set(name, c);
  }
}

function cookieHeader(jar) {
  return [...jar.values()].join("; ");
}

async function main() {
  const jar = new Map();

  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  mergeCookies(jar, parseSetCookies(csrfRes));
  const { csrfToken } = await csrfRes.json();

  const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookieHeader(jar),
    },
    body: new URLSearchParams({ email: EMAIL, password: PASSWORD, csrfToken, redirect: "false", json: "true" }),
    redirect: "manual",
  });
  mergeCookies(jar, parseSetCookies(loginRes));

  const sessionRes = await fetch(`${BASE_URL}/api/auth/session`, { headers: { Cookie: cookieHeader(jar) } });
  const session = await sessionRes.json();
  if (!session?.user?.email) {
    console.error("Login failed, session:", session);
    process.exit(1);
  }
  console.log(`Logged in as ${session.user.email}`);

  const results = [];

  for (const song of SONGS) {
    const raw = await readFile(path.join(FOLDER, song.file), "utf-8");
    const lyricsText = raw.trim();
    const targetDurationSeconds = recommendedDuration(lyricsText);

    console.log(`\n=== ${song.file} (${song.language}, ${targetDurationSeconds}s) ===`);

    const res = await fetch(`${BASE_URL}/api/generations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieHeader(jar) },
      body: JSON.stringify({
        stylePrompt: song.style,
        instrumental: false,
        language: song.language,
        lyricsText,
        targetDurationSeconds,
        versions: 1,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error(`SUBMIT FAILED -- ${data.error}`);
      results.push({ file: song.file, status: "SUBMIT_FAILED", detail: data.error });
      continue;
    }
    console.log(`submitted, batchId ${data.batchId} -- polling...`);

    // poll GET /api/generations for this batch until it completes/fails
    let finalStatus = "timeout";
    let detail = "";
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const listRes = await fetch(`${BASE_URL}/api/generations`, { headers: { Cookie: cookieHeader(jar) } });
      const list = await listRes.json();
      const gen = list.generations.find((g) => g.batchId === data.batchId);
      if (!gen) continue;
      if (gen.status === "completed") {
        finalStatus = "OK";
        detail = `${gen.song?.durationSeconds}s, title "${gen.song?.title}"`;
        break;
      }
      if (gen.status === "failed" || gen.status === "rejected_moderation") {
        finalStatus = gen.status.toUpperCase();
        detail = gen.errorMessage ?? "";
        break;
      }
    }
    console.log(`${finalStatus} -- ${detail}`);
    results.push({ file: song.file, status: finalStatus, detail });
  }

  console.log("\n\n=== Summary ===");
  for (const r of results) console.log(`${r.status.padEnd(18)} ${r.file} -- ${r.detail}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
