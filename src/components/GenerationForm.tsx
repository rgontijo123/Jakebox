"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { VoiceRecorderModal } from "@/components/VoiceRecorderModal";

// Keep in sync with CREDITS_PER_GENERATION in src/lib/credits.ts -- can't
// import it directly, that module pulls in the server-only Prisma client.
const CREDITS_PER_GENERATION = 100;

// Persisted across page navigations (not just across generations on the same
// page) so going to check a result and coming back to Create doesn't lose
// what you typed -- these two are the expensive-to-retype fields.
const STYLE_STORAGE_KEY = "jakebox:draft:stylePrompt";
const LYRICS_STORAGE_KEY = "jakebox:draft:lyricsText";
const LANGUAGE_STORAGE_KEY = "jakebox:draft:language";

const LYRICS_PLACEHOLDER = `[Verse]
Walking down a sunny road today
Nothing standing in my way

[Chorus]
This is our moment, our moment to shine
Everything's gonna be just fine`;

export type RemixSeed = { stylePrompt: string; lyricsText: string; nonce: number };
export type StyleSeed = { value: string; nonce: number };

export function GenerationForm({
  onCreated,
  remixSeed,
  styleSeed,
}: {
  onCreated?: (batchId: string) => void;
  remixSeed?: RemixSeed | null;
  styleSeed?: StyleSeed | null;
}) {
  const router = useRouter();
  const [stylePrompt, setStylePrompt] = useState("");
  const [instrumental, setInstrumental] = useState(false);
  const [language, setLanguage] = useState("en");
  const [duration, setDuration] = useState(60);
  const [lyricsText, setLyricsText] = useState("");
  const [versions, setVersions] = useState<1 | 2>(1);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [referenceSongId, setReferenceSongId] = useState("");
  const [voicePersonaId, setVoicePersonaId] = useState("");
  const [recentSongs, setRecentSongs] = useState<{ id: string; title: string }[]>([]);
  const [voices, setVoices] = useState<{ id: string; name: string; status: string }[]>([]);
  const [showRecorder, setShowRecorder] = useState(false);
  const [credits, setCredits] = useState<{ creditBalance: number; unlimited: boolean } | null>(null);
  const usingSpecialMode = Boolean(referenceSongId || voicePersonaId);

  async function loadCredits() {
    const res = await fetch("/api/me/credits");
    if (!res.ok) return;
    setCredits(await res.json());
  }

  async function loadRecentSongs() {
    const res = await fetch("/api/generations?page=1");
    if (!res.ok) return;
    const data = await res.json();
    setRecentSongs(
      data.generations
        .filter((g: { status: string; song: { id: string; title: string } | null }) => g.status === "completed" && g.song)
        .map((g: { song: { id: string; title: string } }) => ({ id: g.song.id, title: g.song.title })),
    );
  }

  async function loadVoices() {
    const res = await fetch("/api/voice-personas");
    if (!res.ok) return;
    const data = await res.json();
    setVoices(data.personas);
  }

  useEffect(() => {
    // Populate the reference-song and voice pickers on mount, can't be
    // computed during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRecentSongs();
    loadVoices();
    loadCredits();
  }, []);

  // Restore on mount client-side only, to avoid an SSR/client hydration
  // mismatch (the server always renders the empty initial state).
  useEffect(() => {
    setStylePrompt(localStorage.getItem(STYLE_STORAGE_KEY) ?? "");
    setLyricsText(localStorage.getItem(LYRICS_STORAGE_KEY) ?? "");
    setLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY) ?? "en");
  }, []);

  useEffect(() => {
    localStorage.setItem(STYLE_STORAGE_KEY, stylePrompt);
  }, [stylePrompt]);

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem(LYRICS_STORAGE_KEY, lyricsText);
  }, [lyricsText]);

  // Remix: WorkspaceList hands us an existing song's style/lyrics through
  // this seed (keyed by `nonce` so remixing the same song twice in a row
  // still re-applies it, since setting the same value again wouldn't
  // otherwise re-trigger the effect).
  useEffect(() => {
    if (!remixSeed) return;
    setStylePrompt(remixSeed.stylePrompt);
    setLyricsText(remixSeed.lyricsText);
    setInstrumental(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remixSeed?.nonce]);

  // Applying a saved style preset from the sidebar -- only touches the style
  // field, keyed by nonce for the same reason as remixSeed above.
  useEffect(() => {
    if (!styleSeed) return;
    // External trigger (sidebar click), same pattern as remixSeed above.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStylePrompt(styleSeed.value);
    document.getElementById("style-textarea")?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleSeed?.nonce]);

  const estimatedCredits = CREDITS_PER_GENERATION * versions;

  // Rough guide for comfortable, unhurried pacing: ~2.3 sung words/second,
  // plus ~15s slack for intro/instrumental breaks. If the chosen duration
  // is much shorter than this, the vocals tend to get crammed in and rushed.
  const lyricsWordCount = lyricsText.trim() ? lyricsText.trim().split(/\s+/).filter(Boolean).length : 0;
  const recommendedSeconds = lyricsWordCount > 0 ? Math.ceil(lyricsWordCount / 2.3) + 15 : 0;
  const durationTooShort = !instrumental && recommendedSeconds > duration + 5;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!stylePrompt.trim()) {
      setError("Describe the style/genre you want");
      return;
    }
    if (!instrumental && !lyricsText.trim()) {
      setError("Add some lyrics, or mark this as instrumental");
      return;
    }
    if (!rightsConfirmed) {
      setError("Please confirm you have the rights to this content");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stylePrompt,
        instrumental,
        language,
        lyricsText: instrumental ? "" : lyricsText,
        targetDurationSeconds: duration,
        versions,
        referenceSongId: referenceSongId || undefined,
        voicePersonaId: voicePersonaId || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      return;
    }

    // Keep stylePrompt/lyricsText filled in after a successful submit --
    // iterating on the same song (different duration, different rhythm)
    // shouldn't require retyping/repasting them every time.
    setRightsConfirmed(false);
    // The charge already happened server-side before this response came
    // back, so the displayed balance is stale until this re-fetch.
    loadCredits();

    if (onCreated) {
      onCreated(data.batchId);
    } else {
      router.push(`/generations/${data.batchId}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
      <label className="flex flex-col gap-1 text-sm">
        Style / genre prompt
        <textarea
          id="style-textarea"
          value={stylePrompt}
          onChange={(e) => setStylePrompt(e.target.value)}
          placeholder="e.g. upbeat 80s synth-pop, female vocals, driving bassline"
          rows={6}
          className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm resize-y min-h-[8rem]"
        />
      </label>

      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={instrumental} onChange={(e) => setInstrumental(e.target.checked)} />
          Instrumental only (no lyrics)
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Language
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-2 w-full"
          >
            <option value="en">English</option>
            <option value="pt-BR">Portuguese (Brazil)</option>
            <option value="pt-PT">Portuguese (Portugal)</option>
            <option value="es">Spanish</option>
            <option value="de">German</option>
            <option value="ja">Japanese</option>
          </select>
        </label>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-zinc-800 p-3">
        <label className="flex flex-col gap-1 text-sm">
          Reference song <span className="text-zinc-500">(optional -- inspires the new song&apos;s style)</span>
          <select
            value={referenceSongId}
            onChange={(e) => {
              setReferenceSongId(e.target.value);
              if (e.target.value) setVoicePersonaId("");
            }}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-2 w-full"
          >
            <option value="">None</option>
            {recentSongs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Voice <span className="text-zinc-500">(optional -- sings with a cloned voice instead of the default)</span>
          <select
            value={voicePersonaId}
            onChange={(e) => {
              setVoicePersonaId(e.target.value);
              if (e.target.value) setReferenceSongId("");
            }}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-2 w-full"
          >
            <option value="">Default voice</option>
            {voices
              .filter((v) => v.status === "ready")
              .map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => setShowRecorder(true)}
          className="self-start text-xs text-zinc-400 hover:text-zinc-100 underline"
        >
          + Record a new voice
        </button>
        {usingSpecialMode && (
          <p className="text-xs text-zinc-500">
            Using a reference song or voice generates a single version, not A/B.
          </p>
        )}
      </div>

      {!instrumental && (
        <label className="flex flex-col gap-1 text-sm">
          Lyrics
          <textarea
            id="lyrics-textarea"
            value={lyricsText}
            onChange={(e) => setLyricsText(e.target.value)}
            placeholder={LYRICS_PLACEHOLDER}
            rows={24}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-mono resize-y min-h-[16rem]"
          />
          <span className="text-xs text-zinc-500">
            Paste a full lyric in one go, mark sections inline with tags like{" "}
            <code className="text-zinc-400">[Verse]</code>, <code className="text-zinc-400">[Chorus]</code>,{" "}
            <code className="text-zinc-400">[Bridge]</code>.
          </span>
        </label>
      )}

      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-2 text-sm">
          Target duration: {duration}s
          <input
            type="range"
            min={10}
            max={300}
            step={5}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
        </label>
        {durationTooShort && (
          <p className="text-xs text-amber-400">
            Your lyrics ({lyricsWordCount} words) need about {recommendedSeconds}s for unhurried pacing —
            at {duration}s the vocals will likely sound rushed.{" "}
            <button
              type="button"
              onClick={() => setDuration(Math.min(300, recommendedSeconds))}
              className="underline"
            >
              Bump to {Math.min(300, recommendedSeconds)}s
            </button>
          </p>
        )}

        <div className="flex items-center gap-2 text-sm">
          <span className="text-zinc-400">Versions:</span>
          <div className="inline-flex rounded-full border border-zinc-700 p-0.5">
            {([1, 2] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVersions(v)}
                disabled={usingSpecialMode}
                className={`px-3 py-1 rounded-full transition-colors disabled:opacity-40 ${
                  versions === v ? "bg-[#F5B900] text-black" : "text-zinc-400 hover:text-zinc-100"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          {versions === 2 && !usingSpecialMode && (
            <span className="text-xs text-zinc-500">2 full generations, compare and keep your favorite</span>
          )}
        </div>
      </div>

      <div className="text-sm text-zinc-400 flex flex-col gap-0.5">
        <p>
          Estimated cost: <span className="text-zinc-100 font-medium">{estimatedCredits} credits</span>{" "}
          {versions === 2 ? "(2 versions) " : ""}
          (refunded automatically if a version fails)
        </p>
        {credits && !credits.unlimited && (
          <p className={credits.creditBalance < estimatedCredits ? "text-red-400" : ""}>
            You have {credits.creditBalance} credits — after this you&apos;ll have{" "}
            {Math.max(0, credits.creditBalance - estimatedCredits)}
            {credits.creditBalance < estimatedCredits && " (not enough credits for this)"}
          </p>
        )}
        {credits?.unlimited && <p>You have unlimited credits (owner/admin)</p>}
      </div>

      <label className="flex items-start gap-2 text-sm text-zinc-400">
        <input
          type="checkbox"
          checked={rightsConfirmed}
          onChange={(e) => setRightsConfirmed(e.target.checked)}
          className="mt-1"
        />
        I confirm I have the rights to generate this content and it doesn&apos;t imitate a real
        artist or infringe on copyright.
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="self-start rounded-full bg-[#F5B900] text-black px-6 py-3 text-sm font-medium hover:bg-[#ffcc33] transition-colors disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Generate song"}
      </button>

      {showRecorder && (
        <VoiceRecorderModal
          onClose={() => setShowRecorder(false)}
          onCreated={loadVoices}
        />
      )}
    </form>
  );
}
