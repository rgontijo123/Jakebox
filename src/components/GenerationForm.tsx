"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LyricsEditor, type LyricSection } from "./LyricsEditor";

const CREDITS_PER_SECOND = 1;
const MIN_CREDITS = 30;

export function GenerationForm() {
  const router = useRouter();
  const [stylePrompt, setStylePrompt] = useState("");
  const [instrumental, setInstrumental] = useState(false);
  const [language, setLanguage] = useState("en");
  const [duration, setDuration] = useState(60);
  const [sections, setSections] = useState<LyricSection[]>([{ type: "verse", text: "" }]);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const estimatedCredits = Math.max(MIN_CREDITS, Math.round(duration * CREDITS_PER_SECOND));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!stylePrompt.trim()) {
      setError("Describe the style/genre you want");
      return;
    }
    if (!instrumental && sections.every((s) => !s.text.trim())) {
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
        lyricsSections: instrumental ? [] : sections.filter((s) => s.text.trim()),
        targetDurationSeconds: duration,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      return;
    }

    router.push(`/generations/${data.generationId}`);
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
        <div>
          <p className="text-sm mb-2">Lyrics</p>
          <LyricsEditor sections={sections} onChange={setSections} />
        </div>
      )}

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

      <p className="text-sm text-zinc-400">
        Estimated cost: <span className="text-zinc-100 font-medium">{estimatedCredits} credits</span>{" "}
        (refunded automatically if the finished song comes in shorter)
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
        className="self-start rounded-full bg-white text-black px-6 py-3 text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Generate song"}
      </button>
    </form>
  );
}
