-- AlterTable
ALTER TABLE "Song" ADD COLUMN "radioIntroKey" TEXT,
ADD COLUMN "radioIntroMs" INTEGER,
ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "publicAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Song_isPublic_idx" ON "Song"("isPublic");

-- CreateTable
CREATE TABLE "SongVote" (
    "id" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SongVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SongVote_songId_userId_key" ON "SongVote"("songId", "userId");

-- CreateIndex
CREATE INDEX "SongVote_userId_idx" ON "SongVote"("userId");

-- AddForeignKey
ALTER TABLE "SongVote" ADD CONSTRAINT "SongVote_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongVote" ADD CONSTRAINT "SongVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
