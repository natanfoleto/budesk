/*
  Warnings:

  - You are about to drop the column `value` on the `employee_contracts` table. All the data in the column will be lost.
  - Added the required column `value_in_cents` to the `employee_contracts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "employee_contracts" DROP COLUMN "value",
ADD COLUMN     "value_in_cents" INTEGER NOT NULL;
