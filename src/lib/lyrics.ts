export type WordTimestamp = { word: string; startMs: number; endMs: number };

export type LyricToken = { text: string; startMs: number | null; endMs: number | null };
export type LyricLine = { isTag: boolean; text: string; words: LyricToken[] };

const TAG_RE = /^\s*\[([^\]]+)]\s*$/;

// Section-header words people commonly type without brackets (English and
// Portuguese), optionally followed by a number ("Verse 2") or a " - "
// production note ("Bridge - instrumental, guitar solo"). Left unbracketed,
// these get sung as if they were lyrics -- including English stage
// directions dropped into an otherwise Portuguese song, which is exactly
// the kind of thing that makes the vocal pronunciation go haywire.
const TAG_WORDS = [
  "intro", "verse\\s*\\d*", "pre-?chorus", "chorus", "final chorus", "hook",
  "bridge", "outro",
  "introdu[cç][aã]o", "verso\\s*\\d*", "refr[aã]o", "pr[eé]-refr[aã]o",
  "refr[aã]o final", "ponte", "final",
];
const IMPLICIT_TAG_RE = new RegExp(`^(${TAG_WORDS.join("|")})\\s*(-.*)?$`, "i");

/** Wraps bare section headers ("Chorus", "Bridge - guitar solo") in
 * brackets so they're treated as structural tags, not sung lyrics, by both
 * the ElevenLabs prompt and the synced-lyrics view. Idempotent -- lines
 * already in `[Tag]` form pass through untouched. */
export function normalizeLyricsTags(lyricsText: string): string {
  return lyricsText
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || TAG_RE.test(trimmed)) return line;
      if (IMPLICIT_TAG_RE.test(trimmed)) return `[${trimmed}]`;
      return line;
    })
    .join("\n");
}

/** Zips raw lyrics text (Suno-style, with [Verse]/[Chorus]/etc tag lines)
 * against ElevenLabs' flat, sequential word-timestamp list. Section tags
 * don't consume timestamps -- only sung words do. Alignment is a simple
 * sequential match (not fuzzy): ElevenLabs sings from this exact text, so
 * word order lines up closely, though ad-libs/repeats can drift the match
 * over a long song. We degrade gracefully rather than trying to correct
 * for that -- once timestamps run out, later words just render unsynced. */
export function alignLyrics(lyricsText: string, timestamps: WordTimestamp[]): LyricLine[] {
  const lines = lyricsText.split("\n").map((l) => l.trim()).filter(Boolean);
  let cursor = 0;

  return lines.map((line) => {
    const tagMatch = line.match(TAG_RE);
    if (tagMatch) {
      return { isTag: true, text: tagMatch[1], words: [] };
    }

    const rawWords = line.split(/\s+/).filter(Boolean);
    const words: LyricToken[] = rawWords.map((w) => {
      const ts = timestamps[cursor];
      cursor += 1;
      return { text: w, startMs: ts?.startMs ?? null, endMs: ts?.endMs ?? null };
    });

    return { isTag: false, text: line, words };
  });
}

export function activeWordIndex(words: LyricToken[], currentMs: number): number {
  let active = -1;
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (w.startMs === null) continue;
    if (w.startMs <= currentMs) active = i;
    else break;
  }
  return active;
}
