/** Pre-submit content moderation, run before ever calling ElevenLabs.
 * Two stages: a cheap owner-editable keyword/regex filter, then the free
 * OpenAI Moderation API. Either stage flagging content blocks the
 * generation entirely (no credits charged). */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Owner-editable: tune this list based on real abuse observed. Keep patterns
// broad but low-false-positive; genre descriptors ("80s synth-pop") should
// never trip this.
const BANNED_PATTERNS: RegExp[] = [
  /\bin the style of\s+[\w\s]+\b/i, // "in the style of [named real artist]" -- flagged for manual review via the phrase itself; refine with an allowlist of generic genre terms if this proves too broad
  /\bsound(s)? (exactly )?like\s+[\w\s]+\b/i,
];

export type ModerationResult = {
  flagged: boolean;
  stage: "keyword_filter" | "openai_moderation" | "none";
  categories?: Record<string, boolean>;
  reason?: string;
};

function checkKeywords(text: string): ModerationResult | null {
  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(text)) {
      return { flagged: true, stage: "keyword_filter", reason: `Matched pattern: ${pattern}` };
    }
  }
  return null;
}

async function checkOpenAiModeration(text: string): Promise<ModerationResult> {
  if (!OPENAI_API_KEY) {
    // Fail closed would block all generations if the key is missing; fail
    // open here since the keyword filter already ran as a first line of
    // defense, but log loudly so this doesn't go unnoticed in dev.
    console.warn("OPENAI_API_KEY not set -- skipping OpenAI moderation check");
    return { flagged: false, stage: "none" };
  }

  const res = await fetch("https://api.openai.com/v1/moderations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input: text }),
  });

  if (!res.ok) {
    console.error("OpenAI moderation request failed", res.status, await res.text());
    // Same fail-open reasoning as above -- don't let an OpenAI outage take
    // the whole product down; the keyword filter still ran.
    return { flagged: false, stage: "none" };
  }

  const data = await res.json();
  const result = data.results?.[0];
  if (!result) return { flagged: false, stage: "none" };

  return {
    flagged: result.flagged,
    stage: "openai_moderation",
    categories: result.categories,
  };
}

export async function moderateGenerationRequest(params: {
  stylePrompt: string;
  lyricsText: string;
}): Promise<ModerationResult> {
  const combined = `${params.stylePrompt}\n${params.lyricsText}`;

  const keywordResult = checkKeywords(combined);
  if (keywordResult) return keywordResult;

  return checkOpenAiModeration(combined);
}
