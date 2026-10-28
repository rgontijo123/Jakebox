"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { DICTIONARY, LOCALES, type DictionaryKey, type Locale } from "./translations";

const STORAGE_KEY = "jakebox-locale";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: DictionaryKey) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function detectInitialLocale(): Locale {
  if (typeof window === "undefined") return "en";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "pt") return stored;
  } catch {
    // localStorage can throw in private-browsing/blocked-storage contexts --
    // fall through to browser-language detection instead of crashing.
  }
  return navigator.language.toLowerCase().startsWith("pt") ? "pt" : "en";
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  // Starts "en" on both server and first client render (no access to
  // localStorage/navigator.language during SSR) to avoid a hydration
  // mismatch, then swaps to the detected/saved locale right after mount.
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    setLocaleState(detectInitialLocale());
  }, []);

  function setLocale(next: Locale) {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // best-effort persistence only
    }
  }

  function t(key: DictionaryKey): string {
    return DICTIONARY[key][locale];
  }

  return <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider");
  return ctx;
}

export { LOCALES };
