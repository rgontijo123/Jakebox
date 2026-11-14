"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DICTIONARY, LOCALES, interpolate, type DictionaryKey, type Locale } from "./translations";

const STORAGE_KEY = "jakebox-locale";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: DictionaryKey, vars?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function writeLocaleCookie(locale: Locale) {
  // read by getLocale() in ./server.ts so server components render in the same language
  document.cookie = `${STORAGE_KEY}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

/** `initialLocale` comes from the server (cookie, else Accept-Language), so
 * server and client agree on the first render and there's no flash of the
 * other language. */
export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: React.ReactNode }) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    // Migrate a choice saved before the cookie existed (localStorage only).
    if (document.cookie.includes(`${STORAGE_KEY}=`)) return;
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // localStorage can throw in private-browsing/blocked-storage contexts
    }
    if ((stored === "en" || stored === "pt") && stored !== initialLocale) {
      writeLocaleCookie(stored);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocaleState(stored);
      router.refresh();
    }
  }, [initialLocale, router]);

  function setLocale(next: Locale) {
    setLocaleState(next);
    writeLocaleCookie(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // best-effort persistence only
    }
    // re-render server components (billing, library...) in the new language
    router.refresh();
  }

  function t(key: DictionaryKey, vars?: Record<string, string | number>): string {
    return interpolate(DICTIONARY[key][locale], vars);
  }

  return <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider");
  return ctx;
}

export { LOCALES };
