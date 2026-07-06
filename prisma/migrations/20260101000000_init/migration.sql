-- CreateEnum
CREATE TYPE "Category" AS ENUM ('BUG', 'FEATURE', 'IMPROVEMENT', 'PRAISE', 'OTHER');

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "comment" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Feedback_createdAt_idx" ON "Feedback"("createdAt");

-- CreateIndex
CREATE INDEX "Feedback_category_idx" ON "Feedback"("category");
