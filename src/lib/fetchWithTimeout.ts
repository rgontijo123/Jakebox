/** `fetch` has no default timeout in Node -- if a provider's connection
 * hangs (not just responds slowly, but never responds at all), the await
 * never resolves or rejects, which silently defeats any attempt-count
 * budget wrapped around it (e.g. musicapi.ts's pollUntilDone). This gives
 * every provider call a hard ceiling so a hung connection fails fast
 * instead of stalling a generation indefinitely. */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = 20_000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`Request to ${url} timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
