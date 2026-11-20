"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useLocale } from "@/lib/i18n/LocaleProvider";

// Social apps' built-in browsers: Google refuses to sign in there
// ("disallowed_useragent"), and the login cookie often doesn't survive the
// hop to Google and back. WhatsApp/Telegram open links in the real browser.
const IN_APP = /Instagram|FBAN|FBAV|FB_IAB|FBIOS|musical_ly|Bytedance|TikTok|LinkedInApp|Snapchat/i;

// Auth.js serves /api/auth/providers automatically, listing only the
// providers actually registered in src/auth.ts -- Google/Facebook only
// show up there once their client id/secret env vars are set, so the
// buttons stay hidden instead of rendering broken until that's done.
export default function OAuthButtons() {
  const { t } = useLocale();
  const [providers, setProviders] = useState<string[]>([]);
  const [failed, setFailed] = useState(false);
  const [inApp, setInApp] = useState<null | "android" | "ios">(null);

  useEffect(() => {
    // read on the client only: these depend on the URL / user agent
    /* eslint-disable react-hooks/set-state-in-effect */
    setFailed(new URLSearchParams(window.location.search).has("error"));
    const ua = navigator.userAgent;
    if (IN_APP.test(ua)) setInApp(/Android/i.test(ua) ? "android" : "ios");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((res) => res.json())
      .then((data) => setProviders(Object.keys(data ?? {})))
      .catch(() => setProviders([]));
  }, []);

  const hasGoogle = providers.includes("google");
  const hasFacebook = providers.includes("facebook");
  if (!hasGoogle && !hasFacebook) return failed ? <p className="text-sm text-red-400">{t("oauth_failed")}</p> : null;

  // Android: an intent link hands the page to Chrome. iOS has no equivalent,
  // so explain the ··· menu instead.
  const here = typeof window === "undefined" ? "" : window.location.host + window.location.pathname;
  const chromeIntent = `intent://${here}#Intent;scheme=https;package=com.android.chrome;end`;

  return (
    <div className="flex flex-col gap-2">
      {failed && <p className="text-sm text-red-400">{t("oauth_failed")}</p>}
      {inApp && hasGoogle && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200 flex flex-col gap-2">
          <p>{t("oauth_inapp")}</p>
          {inApp === "android" ? (
            <a href={chromeIntent} className="self-start rounded-full bg-[#F5B900] text-black px-4 py-1.5 font-medium">
              {t("oauth_open_chrome")}
            </a>
          ) : (
            <p className="text-amber-100/80">{t("oauth_inapp_ios")}</p>
          )}
        </div>
      )}
      {hasGoogle && (
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/create" })}
          className="rounded-full border border-zinc-700 px-6 py-3 text-sm font-medium hover:bg-zinc-900 transition-colors"
        >
          {t("oauth_google")}
        </button>
      )}
      {hasFacebook && (
        <button
          type="button"
          onClick={() => signIn("facebook", { callbackUrl: "/create" })}
          className="rounded-full border border-zinc-700 px-6 py-3 text-sm font-medium hover:bg-zinc-900 transition-colors"
        >
          {t("oauth_facebook")}
        </button>
      )}
      <div className="flex items-center gap-3 text-xs text-zinc-600 my-1">
        <div className="h-px flex-1 bg-zinc-800" />
        {t("oauth_or")}
        <div className="h-px flex-1 bg-zinc-800" />
      </div>
    </div>
  );
}
