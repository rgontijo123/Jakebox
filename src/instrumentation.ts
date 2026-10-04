// Runs once when a new server instance starts, before it accepts requests.
// See https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
export async function register() {
  // Node-only: this touches the filesystem and Postgres. The edge runtime
  // also loads this file, so it needs to no-op there instead of crashing on
  // a require it can't satisfy.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

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
