/*
  Warnings:

  - You are about to drop the column `standardEntryTime` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `standardExitTime` on the `employees` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "employees" DROP COLUMN "standardEntryTime",
DROP COLUMN "standardExitTime";
