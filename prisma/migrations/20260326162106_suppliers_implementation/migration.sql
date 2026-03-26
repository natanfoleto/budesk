/*
  Warnings:

  - You are about to drop the column `address` on the `suppliers` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[document]` on the table `suppliers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `suppliers` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PersonType" AS ENUM ('PHYSICAL', 'LEGAL');

-- CreateEnum
CREATE TYPE "SupplierAccountType" AS ENUM ('CHECKING', 'SAVINGS', 'PIX');

-- AlterTable
ALTER TABLE "suppliers" DROP COLUMN "address",
ADD COLUMN     "account" TEXT,
ADD COLUMN     "accountType" "SupplierAccountType",
ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "bank" TEXT,
ADD COLUMN     "branch" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "complement" TEXT,
ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "mobile" TEXT,
ADD COLUMN     "municipalRegistration" TEXT,
ADD COLUMN     "neighborhood" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "number" TEXT,
ADD COLUMN     "personType" "PersonType" NOT NULL DEFAULT 'LEGAL',
ADD COLUMN     "pixKey" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "stateRegistration" TEXT,
ADD COLUMN     "street" TEXT,
ADD COLUMN     "tradeName" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "zipCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_document_key" ON "suppliers"("document");
