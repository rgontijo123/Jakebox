-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('owner', 'admin', 'user');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'banned');

-- CreateEnum
CREATE TYPE "CreditTransactionType" AS ENUM ('purchase', 'signup_bonus', 'generation_charge', 'generation_refund', 'admin_adjustment');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "GenerationStatus" AS ENUM ('pending', 'processing', 'completed', 'failed', 'rejected_moderation');

-- CreateEnum
CREATE TYPE "ModerationStage" AS ENUM ('keyword_filter', 'openai_moderation', 'elevenlabs_rejection');

-- CreateEnum
CREATE TYPE "SupportReportStatus" AS ENUM ('open', 'reviewed', 'actioned');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "creditBalance" INTEGER NOT NULL DEFAULT 0,
    "tosAcceptedAt" TIMESTAMP(3),
    "tosVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "CreditTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "relatedPaymentId" TEXT,
    "relatedGenerationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "amountUsdCents" INTEGER NOT NULL,
    "creditsPurchased" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Generation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "GenerationStatus" NOT NULL DEFAULT 'pending',
    "stylePrompt" TEXT NOT NULL,
    "instrumental" BOOLEAN NOT NULL DEFAULT false,
    "language" TEXT NOT NULL DEFAULT 'en',
    "lyricsSections" JSONB NOT NULL,
    "targetDurationSeconds" INTEGER NOT NULL,
    "actualDurationSeconds" INTEGER,
    "creditsCharged" INTEGER NOT NULL DEFAULT 0,
    "creditsRefunded" INTEGER NOT NULL DEFAULT 0,
    "elevenLabsRequestId" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Generation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Song" (
    "id" TEXT NOT NULL,
    "generationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "audioUrl" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Song_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationLog" (
    "id" TEXT NOT NULL,
    "generationId" TEXT,
    "userId" TEXT NOT NULL,
    "stage" "ModerationStage" NOT NULL,
    "flagged" BOOLEAN NOT NULL,
    "categories" JSONB,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "songId" TEXT,
    "message" TEXT NOT NULL,
    "status" "SupportReportStatus" NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "CreditTransaction_userId_idx" ON "CreditTransaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripeCheckoutSessionId_key" ON "Payment"("stripeCheckoutSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripePaymentIntentId_key" ON "Payment"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE INDEX "Generation_userId_idx" ON "Generation"("userId");

-- CreateIndex
CREATE INDEX "Generation_status_idx" ON "Generation"("status");

-- CreateIndex
CREATE INDEX "Song_userId_idx" ON "Song"("userId");

-- CreateIndex
CREATE INDEX "Song_generationId_idx" ON "Song"("generationId");

-- CreateIndex
CREATE INDEX "ModerationLog_userId_idx" ON "ModerationLog"("userId");

-- CreateIndex
CREATE INDEX "ModerationLog_generationId_idx" ON "ModerationLog"("generationId");

-- CreateIndex
CREATE INDEX "SupportReport_userId_idx" ON "SupportReport"("userId");

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Generation" ADD CONSTRAINT "Generation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Song" ADD CONSTRAINT "Song_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "Generation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Song" ADD CONSTRAINT "Song_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationLog" ADD CONSTRAINT "ModerationLog_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "Generation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationLog" ADD CONSTRAINT "ModerationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportReport" ADD CONSTRAINT "SupportReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportReport" ADD CONSTRAINT "SupportReport_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE SET NULL ON UPDATE CASCADE;
