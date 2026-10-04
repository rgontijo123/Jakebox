export type WordTimestamp = { word: string; startMs: number; endMs: number };

export type LyricToken = { text: string; startMs: number | null; endMs: number | null };
export type LyricLine = { isTag: boolean; text: string; words: LyricToken[] };

// Square brackets mark song-structure tags ([Verse], [Chorus]); curly braces
// mark non-sung production/stage-direction cues ({ghostly synth textures,
// no vocals}). Both are whole-line annotations that never get sung, so both
// must be excluded from word-timestamp alignment the same way -- treating a
// curly cue as regular lyric text was consuming real timestamps meant for
// actual sung words, desyncing the highlighted-word display for the rest of
// the song from that point on.
const TAG_RE = /^\s*[[{]([^\]}]+)[\]}]\s*$/;

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

/** Colons/semicolons ('Grandma said: "..."') introduce a written-language
 * clause break that isn't natural in a lyric line -- observed to make the
 * singing voice stutter/glitch right at the mark -- so those always become
 * a comma-pause. Deliberately leaves periods/exclamation/question marks
 * alone even mid-line: an earlier version also flattened those to commas,
 * but they're what gives a lyric its emphasis and rhythm, and there's no
 * confirmed glitch tied to them (unlike colons) -- doing so risked making
 * vocals sound more like flat spoken narration than singing. */
export function normalizeLyricsPunctuation(lyricsText: string): string {
  return lyricsText
    .split("\n")
    .map((line) => {
      const out = line.replace(/\s*[:;]\s*/g, ", ");
      return out;
    })
    .join("\n");
}

/** Picks a fallback song title when ElevenLabs doesn't return one (observed
 * to happen with composition-plan/music_v2 requests). Falling back to the
 * raw style prompt ("romantic techno, melodic techno") reads as a genre tag,
 * not a song name -- the first actual sung line is a much better stand-in,
 * same instinct as how a lot of song titles get picked in practice. Only
 * falls through to the style prompt when there's no usable lyric line
 * (instrumental tracks). */
export function deriveFallbackTitle(lyricsText: string, stylePrompt: string): string {
  const firstLine = lyricsText
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l && !TAG_RE.test(l));

  const title = firstLine ?? stylePrompt;
  const trimmed = title.trim();
  return trimmed.length > 80 ? `${trimmed.slice(0, 77)}...` : trimmed || "Untitled Track";
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
