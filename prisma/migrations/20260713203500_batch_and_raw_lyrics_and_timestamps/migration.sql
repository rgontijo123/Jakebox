-- batchId: add nullable, backfill each existing row as its own batch of 1, then require it
ALTER TABLE "Generation" ADD COLUMN "batchId" TEXT;
UPDATE "Generation" SET "batchId" = "id" WHERE "batchId" IS NULL;
ALTER TABLE "Generation" ALTER COLUMN "batchId" SET NOT NULL;
CREATE INDEX "Generation_batchId_idx" ON "Generation"("batchId");

-- lyricsText replaces the structured lyricsSections JSON; backfill by
-- flattening whatever section text existed (test data only, fine to
-- approximate) then drop the old column
ALTER TABLE "Generation" ADD COLUMN "lyricsText" TEXT NOT NULL DEFAULT '';
UPDATE "Generation"
SET "lyricsText" = COALESCE(
  (SELECT string_agg(elem->>'text', E'\n') FROM jsonb_array_elements("lyricsSections") AS elem),
  ''
)
WHERE "lyricsSections" IS NOT NULL;
ALTER TABLE "Generation" DROP COLUMN "lyricsSections";

-- word-level timestamps from ElevenLabs, powers the synced lyrics player
ALTER TABLE "Song" ADD COLUMN "wordTimestamps" JSONB;
