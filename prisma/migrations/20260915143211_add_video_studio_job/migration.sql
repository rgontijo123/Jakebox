-- CreateEnum
CREATE TYPE "VideoStudioJobStatus" AS ENUM ('running', 'done', 'error');

-- CreateTable
CREATE TABLE "VideoStudioJob" (
    "id" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "VideoStudioJobStatus" NOT NULL DEFAULT 'running',
    "errorMessage" TEXT,
    "videoUrl" TEXT,
    "durationSeconds" INTEGER,
    "promoText" TEXT,
    "shortUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoStudioJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VideoStudioJob_name_key" ON "VideoStudioJob"("name");

-- CreateIndex
CREATE INDEX "VideoStudioJob_userId_idx" ON "VideoStudioJob"("userId");

-- CreateIndex
CREATE INDEX "VideoStudioJob_songId_idx" ON "VideoStudioJob"("songId");

-- AddForeignKey
ALTER TABLE "VideoStudioJob" ADD CONSTRAINT "VideoStudioJob_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoStudioJob" ADD CONSTRAINT "VideoStudioJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
