-- AlterTable
ALTER TABLE "Generation" ADD COLUMN     "jobHeartbeatAt" TIMESTAMP(3),
ADD COLUMN     "jobParams" JSONB,
ADD COLUMN     "jobProvider" TEXT,
ADD COLUMN     "jobTaskId" TEXT;
