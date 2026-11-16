"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

/** Fires one analytics event when the page renders (e.g. the billing page
 * after Stripe redirects back with ?plan=success). */
export function TrackOnLoad({ event, params }: { event: string; params?: Record<string, string> }) {
  useEffect(() => {
    track(event, params);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per mount
  }, []);
  return null;
}
