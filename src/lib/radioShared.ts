/** Client-safe radio bits (no DB): shared by lib/radio.ts and the player. */
export const RADIO_EPOCH = Date.UTC(2026, 0, 1);
export const STATION_TZ = "America/Sao_Paulo";

export type RadioLang = "pt" | "en";
/** Announcer voices; each song's intro and the greeting before it share one. */
export const RADIO_VOICES = ["male", "female", "young", "cheerful"] as const;
export type RadioVoice = (typeof RADIO_VOICES)[number];
export type RadioItem = {
  kind: "song" | "intro" | "greeting" | "jingle";
  id: string;
  title: string;
  style: string | null;
  durationMs: number;
  audio: string;
  cover: string | null;
  /** greeting only: morning/afternoon/evening takes, picked by station time. */
  variants?: Record<"morning" | "afternoon" | "evening", string>;
};

/** Morning 5–12h, afternoon 12–18h, evening otherwise -- station (Brazil) time. */
export function partOfDay(at: number): "morning" | "afternoon" | "evening" {
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: STATION_TZ, hour: "numeric", hourCycle: "h23" }).format(at));
  return hour >= 5 && hour < 12 ? "morning" : hour >= 12 && hour < 18 ? "afternoon" : "evening";
}

