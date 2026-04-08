/*
  Warnings:

  - You are about to drop the column `dayOfWeek` on the `AvailabilitySlot` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "AvailabilitySlot_userId_dayOfWeek_idx";

-- DropIndex
DROP INDEX "AvailabilitySlot_userId_dayOfWeek_startTime_endTime_idx";

-- AlterTable
ALTER TABLE "AvailabilitySlot" DROP COLUMN "dayOfWeek";

-- DropEnum
DROP TYPE "DayOfWeek";

-- CreateIndex
CREATE INDEX "AvailabilitySlot_userId_idx" ON "AvailabilitySlot"("userId");

-- CreateIndex
CREATE INDEX "AvailabilitySlot_userId_startTime_endTime_idx" ON "AvailabilitySlot"("userId", "startTime", "endTime");
