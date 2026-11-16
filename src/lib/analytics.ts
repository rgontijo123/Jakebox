/** Google Analytics 4 measurement ID. Not a secret (it ships in every page);
 * empty disables analytics entirely, e.g. in local dev. */
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";

export const CONSENT_KEY = "jakebox-analytics-consent";

type Gtag = (...args: unknown[]) => void;

/** Sends a GA4 event. A no-op when analytics isn't loaded; under consent
 * mode the visitor's cookie choice decides what Google keeps. */
export function track(event: string, params?: Record<string, string | number | boolean>) {
  const gtag = (globalThis as { gtag?: Gtag }).gtag;
  if (GA_ID && gtag) gtag("event", event, params ?? {});
}
