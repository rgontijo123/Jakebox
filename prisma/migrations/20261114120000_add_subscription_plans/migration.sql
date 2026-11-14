-- AlterTable
ALTER TABLE "User" ADD COLUMN     "planCancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "planCurrentPeriodEnd" TIMESTAMP(3),
ADD COLUMN     "planId" TEXT,
ADD COLUMN     "planStatus" TEXT,
ADD COLUMN     "songQuota" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'usd',
ADD COLUMN     "songsGranted" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stripeInvoiceId" TEXT;

-- AlterTable
ALTER TABLE "Generation" ADD COLUMN     "songQuotaUsed" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeSubscriptionId_key" ON "User"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripeInvoiceId_key" ON "Payment"("stripeInvoiceId");
