/*
  Warnings:

  - You are about to drop the column `planting_type` on the `employees` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "employees" DROP COLUMN "planting_type",
ADD COLUMN     "planting_category" TEXT;
