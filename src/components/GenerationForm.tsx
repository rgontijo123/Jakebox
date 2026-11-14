"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { VoiceRecorderModal } from "@/components/VoiceRecorderModal";
import { GenrePicker } from "@/components/GenrePicker";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { DictionaryKey } from "@/lib/i18n/translations";

// Keep in sync with src/lib/credits.ts's creditsForDuration -- can't import
// it directly, that module pulls in the server-only Prisma client.
const CREDITS_PER_GENERATION = 100;
const BASE_DURATION_SECONDS = 60;
const EXTRA_CREDITS_PER_STEP = 25;
const EXTRA_DURATION_STEP_SECONDS = 30;

function creditsForDuration(durationSeconds: number): number {
  if (durationSeconds <= BASE_DURATION_SECONDS) return CREDITS_PER_GENERATION;
  const extraSteps = Math.ceil((durationSeconds - BASE_DURATION_SECONDS) / EXTRA_DURATION_STEP_SECONDS);
  return CREDITS_PER_GENERATION + extraSteps * EXTRA_CREDITS_PER_STEP;
}

// Persisted across page navigations (not just across generations on the same
// page) so going to check a result and coming back to Create doesn't lose
// what you typed -- these two are the expensive-to-retype fields.
const STYLE_STORAGE_KEY = "jakebox:draft:stylePrompt";
const LYRICS_STORAGE_KEY = "jakebox:draft:lyricsText";
const LANGUAGE_STORAGE_KEY = "jakebox:draft:language";

// Known server error messages -> translated text (anything else is shown as-is)
const API_ERROR_KEYS: Record<string, DictionaryKey> = {
  "Insufficient credits": "err_insufficient_credits",
  "Daily generation limit reached, try again tomorrow": "err_daily_limit",
  "This request was rejected by our content policy.": "err_content_policy",
};

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
  const { t } = useLocale();
  const [stylePrompt, setStylePrompt] = useState("");
  const [instrumental, setInstrumental] = useState(false);
  const [language, setLanguage] = useState("en");
  const [duration, setDuration] = useState(60);
  const [lyricsText, setLyricsText] = useState("");
  const [versions, setVersions] = useState<1 | 2>(1);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outOfCredits, setOutOfCredits] = useState(false);
  const [loading, setLoading] = useState(false);

  const [referenceSongId, setReferenceSongId] = useState("");
  const [voicePersonaId, setVoicePersonaId] = useState("");
  const [recentSongs, setRecentSongs] = useState<{ id: string; title: string }[]>([]);
  const [voices, setVoices] = useState<{ id: string; name: string; status: string }[]>([]);
  const [showRecorder, setShowRecorder] = useState(false);
  const [credits, setCredits] = useState<{ creditBalance: number; unlimited: boolean; songQuota: number } | null>(null);
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

    // Refetch when the tab regains focus -- covers an admin top-up (or a
    // generation charge from another tab/device) landing while this page
    // was already open, which the initial-mount fetch above can't see.
    window.addEventListener("focus", loadCredits);
    return () => window.removeEventListener("focus", loadCredits);
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

  const estimatedCredits = creditsForDuration(duration) * versions;
  // trial/plan songs are spent first, one per version, before any credits
  const songsFromQuota = Math.min(credits?.songQuota ?? 0, versions);
  const creditsNeeded = creditsForDuration(duration) * (versions - songsFromQuota);

  // Rough guide for comfortable, unhurried pacing: ~2.3 sung words/second,
  // plus ~15s slack for intro/instrumental breaks. If the chosen duration
  // is much shorter than this, the vocals tend to get crammed in and rushed.
  const lyricsWordCount = lyricsText.trim() ? lyricsText.trim().split(/\s+/).filter(Boolean).length : 0;
  const recommendedSeconds = lyricsWordCount > 0 ? Math.ceil(lyricsWordCount / 2.3) + 15 : 0;
  const durationTooShort = !instrumental && recommendedSeconds > duration + 5;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOutOfCredits(false);

    if (!stylePrompt.trim()) {
      setError(t("gen_err_style"));
      return;
    }
    if (!instrumental && !lyricsText.trim()) {
      setError(t("gen_err_lyrics"));
      return;
    }
    if (!rightsConfirmed) {
      setError(t("gen_err_rights"));
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
      const errorKey = API_ERROR_KEYS[data.error];
      setError(errorKey ? t(errorKey) : (data.error ?? t("err_generic")));
      setOutOfCredits(res.status === 402);
      // A failed submit is often itself caused by a stale balance (e.g. an
      // admin top-up that landed while this tab was already open) -- refetch
      // so the displayed number matches what the server just said.
      loadCredits();
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
      <GenrePicker
        currentPrompt={stylePrompt}
        onPick={(style) => {
          setStylePrompt(style.prompt);
          if (style.language) setLanguage(style.language);
        }}
      />

      <label className="flex flex-col gap-1 text-sm">
        {t("gen_style_label")}
        <textarea
          id="style-textarea"
          value={stylePrompt}
          onChange={(e) => setStylePrompt(e.target.value)}
          placeholder={t("gen_style_placeholder")}
          rows={6}
          className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm resize-y min-h-[8rem]"
        />
      </label>

      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={instrumental} onChange={(e) => setInstrumental(e.target.checked)} />
          {t("gen_instrumental")}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          {t("gen_language")}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-2 w-full"
          >
            <option value="en">{t("lang_en")}</option>
            <option value="pt-BR">{t("lang_pt_br")}</option>
            <option value="pt-PT">{t("lang_pt_pt")}</option>
            <option value="es">{t("lang_es")}</option>
            <option value="de">{t("lang_de")}</option>
            <option value="ja">{t("lang_ja")}</option>
          </select>
        </label>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-zinc-800 p-3">
        <label className="flex flex-col gap-1 text-sm">
          {t("gen_reference_song")} <span className="text-zinc-500">{t("gen_reference_hint")}</span>
          <select
            value={referenceSongId}
            onChange={(e) => {
              setReferenceSongId(e.target.value);
              if (e.target.value) setVoicePersonaId("");
            }}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-2 w-full"
          >
            <option value="">{t("gen_none")}</option>
            {recentSongs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          {t("gen_voice")} <span className="text-zinc-500">{t("gen_voice_hint")}</span>
          <select
            value={voicePersonaId}
            onChange={(e) => {
              setVoicePersonaId(e.target.value);
              if (e.target.value) setReferenceSongId("");
            }}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-2 w-full"
          >
            <option value="">{t("gen_default_voice")}</option>
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
          {t("gen_record_voice")}
        </button>
        {usingSpecialMode && (
          <p className="text-xs text-zinc-500">
            {t("gen_single_version_note")}
          </p>
        )}
      </div>

      {!instrumental && (
        <label className="flex flex-col gap-1 text-sm">
          {t("gen_lyrics")}
          <textarea
            id="lyrics-textarea"
            value={lyricsText}
            onChange={(e) => setLyricsText(e.target.value)}
            placeholder={t("gen_lyrics_placeholder")}
            rows={24}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-mono resize-y min-h-[16rem]"
          />
          <span className="text-xs text-zinc-500">
            {t("gen_lyrics_hint")}{" "}
            <code className="text-zinc-400">[Verse]</code>, <code className="text-zinc-400">[Chorus]</code>,{" "}
            <code className="text-zinc-400">[Bridge]</code>.
          </span>
        </label>
      )}

      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-2 text-sm">
          <span className="flex items-center gap-2">
            {t("gen_duration", { s: duration })}
            <span className="rounded-full bg-[#F5B900]/15 text-[#F5B900] text-xs font-medium px-2 py-0.5">
              {t("gen_credits_n", { n: creditsForDuration(duration) * versions })}
            </span>
          </span>
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
            {t("gen_rushed", { words: lyricsWordCount, rec: recommendedSeconds, dur: duration })}{" "}
            <button
              type="button"
              onClick={() => setDuration(Math.min(300, recommendedSeconds))}
              className="underline"
            >
              {t("gen_bump_to", { s: Math.min(300, recommendedSeconds) })}
            </button>
          </p>
        )}

        <div className="flex items-center gap-2 text-sm">
          <span className="text-zinc-400">{t("gen_versions")}</span>
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
          {/* Always mounted, visibility toggled via CSS rather than
              conditionally adding/removing this node -- a page translator
              extension (e.g. Chrome's built-in Google Translate) rewrites
              text nodes directly in the DOM, and React inserting/removing a
              sibling around text it's also touching is what throws
              "insertBefore: node is not a child of this node" and crashes
              the page. Toggling a class on an always-present node avoids
              that whole class of conflict. */}
          <span className={`text-xs text-zinc-500 ${versions === 2 && !usingSpecialMode ? "" : "hidden"}`}>
            {t("gen_two_versions_hint")}
          </span>
        </div>
      </div>

      <div className="text-sm text-zinc-400 flex flex-col gap-0.5">
        <p>
          {t("gen_estimated_cost")}{" "}
          <span className="text-zinc-100 font-medium">{t("gen_credits_n", { n: estimatedCredits })}</span>{" "}
          <span className={versions === 2 ? "" : "hidden"}>{t("gen_two_versions")} </span>
          {t("gen_refund_note")}
        </p>
        {credits && !credits.unlimited && songsFromQuota > 0 && (
          <p className="text-green-400">
            {t("gen_uses_quota", { used: songsFromQuota, total: credits.songQuota })}
            {creditsNeeded > 0 ? t("gen_plus_credits", { n: creditsNeeded }) : t("gen_no_credits_needed")}
          </p>
        )}
        {credits && !credits.unlimited && creditsNeeded > 0 && (
          <p className={credits.creditBalance < creditsNeeded ? "text-red-400" : ""}>
            {t("gen_balance", {
              have: credits.creditBalance,
              after: Math.max(0, credits.creditBalance - creditsNeeded),
            })}
            {credits.creditBalance < creditsNeeded && t("gen_not_enough")}
          </p>
        )}
        {credits?.unlimited && <p>{t("gen_unlimited")}</p>}
      </div>

      <label className="flex items-start gap-2 text-sm text-zinc-400">
        <input
          type="checkbox"
          checked={rightsConfirmed}
          onChange={(e) => setRightsConfirmed(e.target.checked)}
          className="mt-1"
        />
        {t("gen_rights")}
      </label>

      {error && (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-red-400">{error}</p>
          {outOfCredits && (
            <Link
              href="/billing"
              className="rounded-full bg-[#F5B900] text-black px-4 py-1.5 text-sm font-medium hover:bg-[#ffcc33] transition-colors"
            >
              {t("gen_see_plans")}
            </Link>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="self-start rounded-full bg-[#F5B900] text-black px-6 py-3 text-sm font-medium hover:bg-[#ffcc33] transition-colors disabled:opacity-50"
      >
        {loading ? t("gen_submitting") : t("gen_submit")}
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
