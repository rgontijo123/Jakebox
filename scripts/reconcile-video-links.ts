import "dotenv/config";
import { reconcileOrphanedVideos } from "../src/lib/videoReconcile";

async function main() {
  const { relinked, checked } = await reconcileOrphanedVideos();
  console.log(`\nChecked ${checked} video-less song(s), relinked ${relinked}.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
