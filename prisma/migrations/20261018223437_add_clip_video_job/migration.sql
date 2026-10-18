-- CreateEnum
CREATE TYPE "ClipVideoJobStatus" AS ENUM ('processing', 'done', 'error');

-- CreateTable
CREATE TABLE "ClipVideoJob" (
    "id" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ClipVideoJobStatus" NOT NULL DEFAULT 'processing',
    "errorMessage" TEXT,
    "clipCount" INTEGER NOT NULL,
    "videoUrl" TEXT,
    "durationSeconds" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClipVideoJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClipVideoJob_userId_idx" ON "ClipVideoJob"("userId");

-- CreateIndex
CREATE INDEX "ClipVideoJob_songId_idx" ON "ClipVideoJob"("songId");

-- AddForeignKey
ALTER TABLE "ClipVideoJob" ADD CONSTRAINT "ClipVideoJob_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClipVideoJob" ADD CONSTRAINT "ClipVideoJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
