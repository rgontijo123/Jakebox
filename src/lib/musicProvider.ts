/** Tries music generation backends in order, falling through to the next
 * configured one whenever the current one fails for ANY reason -- quota
 * exhausted, an outage, a timeout, an unexpected schema change, whatever.
 * The point is resilience: MusicAPI.ai (an unofficial Suno-adjacent proxy)
 * gives by far the best output quality seen so far, but it's inherently the
 * least stable link in the chain (no official Suno API exists to depend on
 * instead). Rather than that risk meaning "the app stops generating music,"
 * it should mean "quality quietly drops to the next provider until it's
 * back" -- Jakebox keeps working either way.
 *
 * Order comes from MUSIC_PROVIDER_ORDER (comma-separated, e.g.
 * "musicapi,treblo,mureka"); unset falls back to DEFAULT_ORDER.
 * Providers with no API key set are skipped automatically -- no need to
 * remove them from the order when you don't have a key yet. Only when every
 * configured provider in the order fails does generateMusic actually throw,
 * with the last provider's error. */

import * as treblo from "@/lib/treblo";
import * as mureka from "@/lib/mureka";
import * as musicapi from "@/lib/musicapi";
import * as aimusicapi from "@/lib/aimusicapi";
import { MusicGenerationError, type GenerateMusicParams, type GenerateMusicResult } from "@/lib/musicProviderTypes";

export { MusicGenerationError } from "@/lib/musicProviderTypes";
export type { GenerateMusicParams, GenerateMusicResult } from "@/lib/musicProviderTypes";

type ProviderName = "treblo" | "mureka" | "musicapi" | "aimusicapi";

const PROVIDERS: Record<
  ProviderName,
  { generateMusic: (params: GenerateMusicParams) => Promise<GenerateMusicResult>; hasKey: () => boolean }
> = {
  treblo: { generateMusic: treblo.generateMusic, hasKey: () => !!process.env.TREBLO_API_KEY },
  mureka: { generateMusic: mureka.generateMusic, hasKey: () => !!process.env.MUREKA_API_KEY },
  musicapi: { generateMusic: musicapi.generateMusic, hasKey: () => !!process.env.MUSICAPI_KEY },
  aimusicapi: { generateMusic: aimusicapi.generateMusic, hasKey: () => !!process.env.AIMUSICAPI_KEY },
};

// Best output quality first (musicapi/aimusicapi's Suno-adjacent Sonic
// engine, per a direct side-by-side listening comparison -- the two are
// likely built on shared upstream infrastructure, so they're back-to-back
// rather than true independent redundancy, but still worth trying in turn
// since only one might be out of credit at a given time), then the remaining
// providers as a safety net if both are unavailable.
const DEFAULT_ORDER: ProviderName[] = ["musicapi", "aimusicapi", "treblo", "mureka"];

function resolveOrder(): ProviderName[] {
  const raw = process.env.MUSIC_PROVIDER_ORDER;
  if (!raw) return DEFAULT_ORDER;
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((name): name is ProviderName => name in PROVIDERS);
}

export async function generateMusic(params: GenerateMusicParams): Promise<GenerateMusicResult> {
  const order = resolveOrder().filter((name) => PROVIDERS[name].hasKey());
  if (order.length === 0) {
    throw new MusicGenerationError("No music provider is configured (no API key set for any of them)", 500);
  }

  let lastError: unknown;
  for (const name of order) {
    try {
      const result = await PROVIDERS[name].generateMusic(params);
      return { ...result, provider: name };
    } catch (err) {
      lastError = err;
      console.warn(`Music provider "${name}" failed, falling through to the next one`, err);
    }
  }
  throw lastError;
}
