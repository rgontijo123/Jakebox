-- AlterTable
ALTER TABLE "Song" ADD COLUMN "radioAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Song_radioAt_idx" ON "Song"("radioAt");
