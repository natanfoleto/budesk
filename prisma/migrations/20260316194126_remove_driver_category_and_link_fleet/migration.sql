/*
  Warnings:

  - You are about to drop the column `categoryId` on the `driver_allocations` table. All the data in the column will be lost.
  - You are about to drop the `driver_categories` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "driver_allocations" DROP CONSTRAINT "driver_allocations_categoryId_fkey";

-- AlterTable
ALTER TABLE "driver_allocations" DROP COLUMN "categoryId",
ADD COLUMN     "vehicleId" TEXT;

-- DropTable
DROP TABLE "driver_categories";

-- CreateIndex
CREATE INDEX "driver_allocations_vehicleId_idx" ON "driver_allocations"("vehicleId");

-- AddForeignKey
ALTER TABLE "driver_allocations" ADD CONSTRAINT "driver_allocations_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
