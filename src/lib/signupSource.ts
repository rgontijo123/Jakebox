// Where a new account came from: first external visit wins (first touch).
// src/proxy.ts writes the cookie; signup / OAuth sign-up read it once.
export const SOURCE_COOKIE = "jakebox-src";

const KNOWN: [RegExp, string][] = [
  [/(^|\.)instagram\.com$|^ig$/i, "instagram"],
  [/(^|\.)facebook\.com$|(^|\.)fb\.(com|me)$|^fb$/i, "facebook"],
  [/(^|\.)linkedin\.com$|^lnkd\.in$/i, "linkedin"],
  [/(^|\.)youtube\.com$|^youtu\.be$|^yt$/i, "youtube"],
  [/(^|\.)tiktok\.com$/i, "tiktok"],
  [/(^|\.)whatsapp\.(com|net)$|^wa\.me$/i, "whatsapp"],
  [/(^|\.)(t\.co|x\.com|twitter\.com)$/i, "x"],
  [/(^|\.)google\.[a-z.]+$|(^|\.)bing\.com$|(^|\.)duckduckgo\.com$|(^|\.)yahoo\.com$/i, "search"],
  [/(^|\.)spotify\.com$/i, "spotify"],
];

/** "instagram" / "linkedin" / ... or the bare host for anything else. */
export function classifySource(value: string) {
  const v = value.trim().toLowerCase().replace(/^www\./, "");
  for (const [re, name] of KNOWN) if (re.test(v)) return name;
  return v.slice(0, 60);
}

/** Cookie value -> fields stored on the User row. No cookie = came straight
 * to the site (typed the address, a WhatsApp link, an app...). */
export function parseSourceCookie(raw: string | undefined) {
  if (!raw) return { signupSource: "direct", signupReferrer: null, signupLanding: null };
  const [source, referrer, landing] = decodeURIComponent(raw).split("|");
  return {
    signupSource: source || "direct",
    signupReferrer: referrer || null,
    signupLanding: landing || null,
  };
}

export const SOURCE_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  tiktok: "TikTok",
  whatsapp: "WhatsApp",
  x: "X / Twitter",
  search: "Google / pesquisa",
  spotify: "Spotify",
  direct: "Direto / sem origem",
};
export const sourceLabel = (s: string | null | undefined) => (s ? (SOURCE_LABELS[s] ?? s) : "-");
