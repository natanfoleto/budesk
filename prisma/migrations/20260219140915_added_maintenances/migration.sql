/*
  Warnings:

  - A unique constraint covering the columns `[maintenanceId]` on the table `financial_transactions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('PREVENTIVA', 'CORRETIVA', 'PREDITIVA');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('PENDENTE', 'AGENDADA', 'REALIZADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "MaintenancePriority" AS ENUM ('BAIXA', 'MEDIA', 'ALTA');

-- AlterTable
ALTER TABLE "employment_records" ADD COLUMN     "hasMedicalExam" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasSignedEpiReceipt" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasSignedRegistration" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "financial_transactions" ADD COLUMN     "maintenanceId" TEXT;

-- CreateTable
CREATE TABLE "maintenances" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "type" "MaintenanceType" NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "MaintenancePriority" NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "completedDate" TIMESTAMP(3),
    "currentKm" INTEGER,
    "nextKm" INTEGER,
    "nextDate" TIMESTAMP(3),
    "isRecurrent" BOOLEAN NOT NULL DEFAULT false,
    "intervalKm" INTEGER,
    "intervalDays" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "estimatedCost" INTEGER NOT NULL,
    "finalCost" INTEGER,
    "costCenter" TEXT,
    "supplierId" TEXT,
    "invoiceNumber" TEXT,
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'PENDENTE',
    "internalNotes" TEXT,
    "attachments" JSONB,
    "approvalResponsible" TEXT,
    "downtimeDays" INTEGER,
    "operationalImpact" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "financial_transactions_maintenanceId_key" ON "financial_transactions"("maintenanceId");

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_maintenanceId_fkey" FOREIGN KEY ("maintenanceId") REFERENCES "maintenances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenances" ADD CONSTRAINT "maintenances_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenances" ADD CONSTRAINT "maintenances_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
