-- CreateEnum
CREATE TYPE "VoicePersonaStatus" AS ENUM ('pending', 'ready', 'failed');

-- CreateTable
CREATE TABLE "VoicePersona" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "VoicePersonaStatus" NOT NULL DEFAULT 'pending',
    "personaId" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoicePersona_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VoicePersona_userId_idx" ON "VoicePersona"("userId");

-- AddForeignKey
ALTER TABLE "VoicePersona" ADD CONSTRAINT "VoicePersona_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
