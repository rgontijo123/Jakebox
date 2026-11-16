import { cookies, headers } from "next/headers";
import { LANG_HEADER } from "./langHeader";
import { DICTIONARY, interpolate, type DictionaryKey, type Locale } from "./translations";

export const LOCALE_COOKIE = "jakebox-locale";

/** Locale for server components: the cookie LocaleProvider writes when the
 * user picks a language, else the browser's Accept-Language. */
export async function getLocale(): Promise<Locale> {
  const pinned = (await headers()).get(LANG_HEADER); // ?lang=pt|en via src/proxy.ts
  if (pinned === "en" || pinned === "pt") return pinned;
  const stored = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (stored === "en" || stored === "pt") return stored;
  const accept = (await headers()).get("accept-language") ?? "";
  return accept.toLowerCase().startsWith("pt") ? "pt" : "en";
}

export async function getT() {
  const locale = await getLocale();
  return {
    locale,
    t: (key: DictionaryKey, vars?: Record<string, string | number>) => interpolate(DICTIONARY[key][locale], vars),
  };
}
