/*
  Warnings:

  - You are about to drop the column `amount` on the `accounts_payable` table. All the data in the column will be lost.
  - You are about to drop the column `salary` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `financial_transactions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[transactionId]` on the table `employee_advances` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[document]` on the table `employees` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `value_in_cents` to the `accounts_payable` table without a default value. This is not possible if the table is not empty.
  - Added the required column `salary_in_cents` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value_in_cents` to the `financial_transactions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ShirtSize" AS ENUM ('P', 'M', 'G', 'GG', 'XGG');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('ACTIVE', 'FINISHED', 'TERMINATED');

-- AlterTable
ALTER TABLE "accounts_payable" DROP COLUMN "amount",
ADD COLUMN     "value_in_cents" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "address" TEXT,
ADD COLUMN     "document" TEXT;

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "clientId" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "vehicleId" TEXT,
ALTER COLUMN "category" DROP NOT NULL;

-- AlterTable
ALTER TABLE "employee_advances" ADD COLUMN     "payrollReference" TEXT,
ADD COLUMN     "transactionId" TEXT;

-- AlterTable
ALTER TABLE "employees" DROP COLUMN "salary",
ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "document" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "pantsSize" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "rg" TEXT,
ADD COLUMN     "salary_in_cents" INTEGER NOT NULL,
ADD COLUMN     "shirtSize" "ShirtSize",
ADD COLUMN     "shoeSize" TEXT,
ADD COLUMN     "standardEntryTime" TEXT,
ADD COLUMN     "standardExitTime" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "role" DROP NOT NULL;

-- AlterTable
ALTER TABLE "financial_transactions" DROP COLUMN "amount",
ADD COLUMN     "value_in_cents" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "address" TEXT,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "document" TEXT;

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "brand" TEXT,
ADD COLUMN     "model" TEXT,
ADD COLUMN     "year" INTEGER,
ALTER COLUMN "description" DROP NOT NULL;

-- CreateTable
CREATE TABLE "employment_records" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "admissionDate" TIMESTAMP(3) NOT NULL,
    "terminationDate" TIMESTAMP(3),
    "jobTitle" TEXT NOT NULL,
    "baseSalary" DECIMAL(10,2) NOT NULL,
    "contractType" TEXT NOT NULL,
    "weeklyWorkload" INTEGER,
    "workRegime" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employment_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_contracts" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "value" DECIMAL(10,2) NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'ACTIVE',
    "description" TEXT,
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_records" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "entryTime" TIMESTAMP(3) NOT NULL,
    "exitTime" TIMESTAMP(3),
    "workedHours" DECIMAL(4,2),
    "overtimeHours" DECIMAL(4,2),
    "absent" BOOLEAN NOT NULL DEFAULT false,
    "justification" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "time_records_employeeId_date_idx" ON "time_records"("employeeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "employee_advances_transactionId_key" ON "employee_advances"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "employees_document_key" ON "employees"("document");

-- AddForeignKey
ALTER TABLE "employee_advances" ADD CONSTRAINT "employee_advances_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "financial_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employment_records" ADD CONSTRAINT "employment_records_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_contracts" ADD CONSTRAINT "employee_contracts_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_records" ADD CONSTRAINT "time_records_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
