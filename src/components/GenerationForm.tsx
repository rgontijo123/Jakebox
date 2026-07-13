"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CREDITS_PER_SECOND = 1;
const MIN_CREDITS = 30;

const LYRICS_PLACEHOLDER = `[Verse]
Walking down a sunny road today
Nothing standing in my way

[Chorus]
This is our moment, our moment to shine
Everything's gonna be just fine`;

export function GenerationForm() {
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

  const estimatedCredits = Math.max(MIN_CREDITS, Math.round(duration * CREDITS_PER_SECOND)) * versions;

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
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      return;
    }

    router.push(`/generations/${data.batchId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full max-w-2xl">
      <label className="flex flex-col gap-1 text-sm">
        Style / genre prompt
        <textarea
          value={stylePrompt}
          onChange={(e) => setStylePrompt(e.target.value)}
          placeholder="e.g. upbeat 80s synth-pop, female vocals, driving bassline"
          rows={2}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
        />
      </label>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={instrumental} onChange={(e) => setInstrumental(e.target.checked)} />
          Instrumental only (no lyrics)
        </label>

        <label className="flex items-center gap-2 text-sm">
          Language
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1"
          >
            <option value="en">English</option>
            <option value="pt">Portuguese</option>
            <option value="es">Spanish</option>
            <option value="de">German</option>
            <option value="ja">Japanese</option>
          </select>
        </label>
      </div>

      {!instrumental && (
        <label className="flex flex-col gap-1 text-sm">
          Lyrics
          <textarea
            value={lyricsText}
            onChange={(e) => setLyricsText(e.target.value)}
            placeholder={LYRICS_PLACEHOLDER}
            rows={10}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-mono"
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

        <div className="flex items-center gap-2 text-sm">
          <span className="text-zinc-400">Versions:</span>
          <div className="inline-flex rounded-full border border-zinc-700 p-0.5">
            {([1, 2] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVersions(v)}
                className={`px-3 py-1 rounded-full transition-colors ${
                  versions === v ? "bg-[#F5B900] text-black" : "text-zinc-400 hover:text-zinc-100"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          {versions === 2 && (
            <span className="text-xs text-zinc-500">2 full generations, compare and keep your favorite</span>
          )}
        </div>
      </div>

      <p className="text-sm text-zinc-400">
        Estimated cost: <span className="text-zinc-100 font-medium">{estimatedCredits} credits</span>{" "}
        {versions === 2 ? "(2 versions) " : ""}
        (refunded automatically if a song comes in shorter, or a version fails)
      </p>

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
    </form>
  );
}
