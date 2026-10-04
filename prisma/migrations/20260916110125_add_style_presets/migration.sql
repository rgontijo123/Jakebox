-- CreateTable
CREATE TABLE "StylePreset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StylePreset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StylePreset_userId_idx" ON "StylePreset"("userId");

-- AddForeignKey
ALTER TABLE "StylePreset" ADD CONSTRAINT "StylePreset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
