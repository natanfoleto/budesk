/*
  Warnings:

  - You are about to drop the `time_records` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `attendance_records` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "time_records" DROP CONSTRAINT "time_records_employeeId_fkey";

-- AlterTable
ALTER TABLE "attendance_records" ADD COLUMN     "bancoHorasImpacto" DECIMAL(4,2),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "time_records";
