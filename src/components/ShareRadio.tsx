"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";

const RADIO_URL = "https://jakeboxmusic.com/radio";

/** "Spread the word" block on /radio: ready-made post text + link for each
 * network. Instagram has no web share link, so it gets the copy-text and a
 * story image to post with a link sticker. */
export function ShareRadio() {
  const { t, locale } = useLocale();
  const [copied, setCopied] = useState<"text" | "link" | null>(null);
  const [canShare, setCanShare] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- browser capability, unknown during SSR
  useEffect(() => setCanShare("share" in navigator), []);
  const text = t("share_text");
  const full = `${text} ${RADIO_URL}`;
  const enc = encodeURIComponent;

  async function copy(what: "text" | "link") {
    try {
      await navigator.clipboard.writeText(what === "text" ? full : RADIO_URL);
      setCopied(what);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // clipboard blocked (http / old browser) -- nothing else to do
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title: t("radio_title"), text, url: RADIO_URL });
    } catch {
      // user closed the sheet
    }
  }

  const links = [
    { label: "WhatsApp", href: `https://wa.me/?text=${enc(full)}`, cls: "bg-[#25D366] text-black" },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(RADIO_URL)}`, cls: "bg-[#1877F2] text-white" },
    { label: "X", href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(RADIO_URL)}`, cls: "bg-white text-black" },
    { label: "Telegram", href: `https://t.me/share/url?url=${enc(RADIO_URL)}&text=${enc(text)}`, cls: "bg-[#229ED9] text-white" },
  ];

  const btn = "rounded-full px-4 py-2 text-sm font-medium transition-opacity hover:opacity-85";

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold text-zinc-100">{t("share_title")}</h2>
        <p className="mt-1 text-xs text-zinc-500">{t("share_hint")}</p>
      </div>

      <p className="rounded-xl bg-zinc-900 px-4 py-3 text-sm text-zinc-300 leading-relaxed break-words">
        {text} <span className="text-[#F5B900]">{RADIO_URL}</span>
      </p>

      <div className="flex flex-wrap gap-2">
        {canShare && (
          <button onClick={nativeShare} className={`${btn} bg-[#F5B900] text-black`}>
            📤 {t("share_native")}
          </button>
        )}
        {links.map((l) => (
          <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className={`${btn} ${l.cls}`}>
            {l.label}
          </a>
        ))}
        <button onClick={() => copy("text")} className={`${btn} border border-zinc-700 text-zinc-200`}>
          {copied === "text" ? `✓ ${t("share_copied")}` : t("share_copy_text")}
        </button>
        <button onClick={() => copy("link")} className={`${btn} border border-zinc-700 text-zinc-200`}>
          {copied === "link" ? `✓ ${t("share_copied")}` : t("share_copy_link")}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-zinc-800 pt-4">
        <a
          href={locale === "pt" ? "/radio/story-pt.jpg" : "/radio/story-en.jpg"}
          download
          className={`${btn} border border-zinc-700 text-zinc-200`}
        >
          ⬇ {t("share_story")}
        </a>
        <span className="text-xs text-zinc-500">{t("share_story_hint")}</span>
      </div>
    </section>
  );
}
