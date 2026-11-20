"use client";

import { useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";

import type { DictionaryKey } from "@/lib/i18n/translations";

const CREATED: [string, DictionaryKey][] = [
  ["yes", "feedback_created_yes"],
  ["partly", "feedback_created_partly"],
  ["no", "feedback_created_no"],
];
const EASE: [string, DictionaryKey][] = [
  ["easy", "feedback_ease_easy"],
  ["ok", "feedback_ease_ok"],
  ["hard", "feedback_ease_hard"],
];

function Choice({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: [string, DictionaryKey][];
  value: string;
  onChange: (v: string) => void;
}) {
  const { t } = useLocale();
  return (
    <div className="flex flex-col gap-2 text-sm">
      {label}
      <div className="flex flex-wrap gap-2" role="radiogroup">
        {options.map(([v, key]) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            onClick={() => onChange(value === v ? "" : v)}
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
              value === v ? "border-[#F5B900] bg-[#F5B900] text-black" : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
            }`}
          >
            {t(key)}
          </button>
        ))}
      </div>
    </div>
  );
}

const INPUT_CLASS = "rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm";

export function FeedbackForm({ token }: { token: string | null }) {
  const { t } = useLocale();
  const [rating, setRating] = useState(0);
  const [createdSong, setCreatedSong] = useState("");
  const [ease, setEase] = useState("");
  const [liked, setLiked] = useState("");
  const [improve, setImprove] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!rating && !createdSong && !ease && !liked.trim() && !improve.trim()) {
      setError(t("feedback_err_empty"));
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ t: token, rating: rating || null, createdSong, ease, liked, improve }),
      });
      if (!res.ok) {
        setError(t("feedback_err_send"));
        return;
      }
      setSent(true);
    } catch {
      setError(t("feedback_err_send"));
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return <p className="rounded-2xl border border-zinc-800 p-5 text-sm text-green-400">{t("feedback_sent")}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
      <Choice label={t("feedback_created")} options={CREATED} value={createdSong} onChange={setCreatedSong} />
      <Choice label={t("feedback_ease")} options={EASE} value={ease} onChange={setEase} />
      <div className="flex flex-col gap-2 text-sm">
        {t("feedback_rating")}
        <div className="flex gap-1" role="radiogroup">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n}/5`}
              onClick={() => setRating(n)}
              className={`text-3xl leading-none transition-colors ${n <= rating ? "text-[#F5B900]" : "text-zinc-600 hover:text-zinc-400"}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        {t("feedback_liked")}
        <textarea
          rows={3}
          maxLength={4000}
          value={liked}
          onChange={(e) => setLiked(e.target.value)}
          className={`${INPUT_CLASS} resize-y`}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        {t("feedback_improve")}
        <textarea
          rows={4}
          maxLength={4000}
          value={improve}
          onChange={(e) => setImprove(e.target.value)}
          placeholder={t("feedback_improve_placeholder")}
          className={`${INPUT_CLASS} resize-y`}
        />
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={sending}
        className="self-start rounded-full bg-[#F5B900] text-black px-6 py-2.5 text-sm font-medium hover:bg-[#ffcc33] transition-colors disabled:opacity-50"
      >
        {sending ? t("forgot_sending") : t("feedback_send")}
      </button>
    </form>
  );
}
