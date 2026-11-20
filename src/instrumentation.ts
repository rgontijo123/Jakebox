// Runs once when a new server instance starts, before it accepts requests.
// See https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
export async function register() {
  // Node-only: this touches the filesystem and Postgres. The edge runtime
  // also loads this file, so it needs to no-op there instead of crashing on
  // a require it can't satisfy.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Generations cut off by a restart (every deploy) are picked up again once
  // the old process is surely gone (its heartbeat goes stale after 2 min).
  const { recoverInterruptedGenerations } = await import("./lib/generationJob");
  const delay = Number(process.env.GENERATION_RECOVERY_DELAY_MS) || 3 * 60_000;
  console.log(`[startup] generation recovery scheduled in ${Math.round(delay / 1000)}s`);
  setTimeout(() => void recoverInterruptedGenerations(), delay);
  setInterval(() => void recoverInterruptedGenerations(), 5 * 60_000).unref();

  // One "what do you think?" email per new account, a day after signup.
  // Only when FEEDBACK_EMAILS=on (see src/lib/feedbackRequest.ts).
  const { sendDueFeedbackRequests } = await import("./lib/feedbackRequest");
  setTimeout(() => void sendDueFeedbackRequests(), 5 * 60_000).unref();
  setInterval(() => void sendDueFeedbackRequests(), 60 * 60_000).unref();

  const { reconcileOrphanedVideos } = await import("./lib/videoReconcile");
  try {
    const { relinked, checked } = await reconcileOrphanedVideos();
    if (relinked > 0) {
      console.log(`[startup] relinked ${relinked} orphaned video(s) out of ${checked} video-less song(s)`);
    }
  } catch (err) {
    // Never block server startup over this -- same best-effort spirit as
    // the video generation step itself.
    console.error("[startup] video reconciliation failed", err);
  }
}
