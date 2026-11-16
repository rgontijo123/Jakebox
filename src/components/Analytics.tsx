"use client";

import Script from "next/script";
import { useSyncExternalStore } from "react";
import { CONSENT_KEY, GA_ID } from "@/lib/analytics";
import { useLocale } from "@/lib/i18n/LocaleProvider";

type Gtag = (...args: unknown[]) => void;

const CHANGE_EVENT = "jakebox-consent-change";

function readConsent(): string | null {
  try {
    return localStorage.getItem(CONSENT_KEY);
  } catch {
    return null;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/** GA4 with Google's consent mode: analytics cookies stay off ("denied")
 * until the visitor accepts in the banner below; the choice is remembered
 * in localStorage. Renders nothing when NEXT_PUBLIC_GA_ID isn't set. */
export function Analytics() {
  const { t } = useLocale();
  // "ssr" on the server and during hydration, so the banner only appears
  // client-side once we know there's no stored choice.
  const choice = useSyncExternalStore(subscribe, readConsent, () => "ssr");

  if (!GA_ID) return null;

  function decide(value: "granted" | "denied") {
    try {
      localStorage.setItem(CONSENT_KEY, value);
    } catch {}
    const gtag = (window as { gtag?: Gtag }).gtag;
    gtag?.("consent", "update", { analytics_storage: value });
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  return (
    <>
      <Script id="ga-consent" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;
var c=null;try{c=localStorage.getItem(${JSON.stringify(CONSENT_KEY)})}catch(e){}
gtag('consent','default',{analytics_storage:c==='granted'?'granted':'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
gtag('js',new Date());gtag('config',${JSON.stringify(GA_ID)});`}
      </Script>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      {choice === null && (
        <div className="fixed inset-x-0 bottom-0 z-50 p-4">
          <div className="mx-auto max-w-2xl rounded-2xl border border-zinc-700 bg-zinc-900/95 p-4 flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-zinc-300 shadow-lg">
            <p className="flex-1">
              {t("cookie_text")}{" "}
              <a href="/privacy" className="underline hover:text-zinc-100">
                {t("footer_privacy")}
              </a>
            </p>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => decide("denied")}
                className="rounded-full bg-zinc-800 px-4 py-2 font-medium text-zinc-100 hover:bg-zinc-700"
              >
                {t("cookie_decline")}
              </button>
              <button
                onClick={() => decide("granted")}
                className="rounded-full bg-[#F5B900] px-4 py-2 font-medium text-black hover:bg-[#ffcc33]"
              >
                {t("cookie_accept")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
