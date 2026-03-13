-- CreateEnum
CREATE TYPE "PlantingProductionType" AS ENUM ('PLANTIO', 'CORTE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AttendanceType" ADD VALUE 'DECLARACAO';
ALTER TYPE "AttendanceType" ADD VALUE 'AFASTAMENTO';

-- CreateTable
CREATE TABLE "planting_seasons" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "totalArea" DECIMAL(10,2),
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planting_seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_fronts" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_fronts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planting_productions" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "employeeId" TEXT NOT NULL,
    "frontId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "type" "PlantingProductionType" NOT NULL,
    "meters" DECIMAL(10,2),
    "meterValueInCents" INTEGER NOT NULL,
    "totalValueInCents" INTEGER NOT NULL,
    "presence" "AttendanceType" NOT NULL DEFAULT 'PRESENCA',
    "notes" TEXT,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planting_productions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_wages" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "employeeId" TEXT NOT NULL,
    "frontId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "valueInCents" INTEGER NOT NULL,
    "presence" "AttendanceType" NOT NULL DEFAULT 'PRESENCA',
    "notes" TEXT,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_wages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultDailyValueInCents" INTEGER NOT NULL,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "driver_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver_allocations" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "employeeId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "frontId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "valueInCents" INTEGER NOT NULL,
    "notes" TEXT,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "driver_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planting_areas" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "frontId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "workedArea" DECIMAL(10,2) NOT NULL,
    "hectares" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planting_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planting_expenses" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "frontId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,2),
    "unitValueInCents" INTEGER,
    "totalValueInCents" INTEGER NOT NULL,
    "vehicleId" TEXT,
    "transactionId" TEXT,
    "notes" TEXT,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planting_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planting_parameters" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planting_parameters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "planting_productions_date_idx" ON "planting_productions"("date");

-- CreateIndex
CREATE INDEX "planting_productions_employeeId_idx" ON "planting_productions"("employeeId");

-- CreateIndex
CREATE INDEX "planting_productions_frontId_idx" ON "planting_productions"("frontId");

-- CreateIndex
CREATE INDEX "daily_wages_date_idx" ON "daily_wages"("date");

-- CreateIndex
CREATE INDEX "daily_wages_employeeId_idx" ON "daily_wages"("employeeId");

-- CreateIndex
CREATE INDEX "daily_wages_frontId_idx" ON "daily_wages"("frontId");

-- CreateIndex
CREATE INDEX "driver_allocations_date_idx" ON "driver_allocations"("date");

-- CreateIndex
CREATE INDEX "driver_allocations_employeeId_idx" ON "driver_allocations"("employeeId");

-- CreateIndex
CREATE INDEX "planting_areas_date_idx" ON "planting_areas"("date");

-- CreateIndex
CREATE INDEX "planting_areas_frontId_idx" ON "planting_areas"("frontId");

-- CreateIndex
CREATE UNIQUE INDEX "planting_expenses_transactionId_key" ON "planting_expenses"("transactionId");

-- CreateIndex
CREATE INDEX "planting_expenses_date_idx" ON "planting_expenses"("date");

-- CreateIndex
CREATE INDEX "planting_expenses_category_idx" ON "planting_expenses"("category");

-- CreateIndex
CREATE UNIQUE INDEX "planting_parameters_key_key" ON "planting_parameters"("key");

-- AddForeignKey
ALTER TABLE "work_fronts" ADD CONSTRAINT "work_fronts_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "planting_seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planting_productions" ADD CONSTRAINT "planting_productions_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planting_productions" ADD CONSTRAINT "planting_productions_frontId_fkey" FOREIGN KEY ("frontId") REFERENCES "work_fronts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planting_productions" ADD CONSTRAINT "planting_productions_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "planting_seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_wages" ADD CONSTRAINT "daily_wages_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_wages" ADD CONSTRAINT "daily_wages_frontId_fkey" FOREIGN KEY ("frontId") REFERENCES "work_fronts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_wages" ADD CONSTRAINT "daily_wages_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "planting_seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_allocations" ADD CONSTRAINT "driver_allocations_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_allocations" ADD CONSTRAINT "driver_allocations_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "driver_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_allocations" ADD CONSTRAINT "driver_allocations_frontId_fkey" FOREIGN KEY ("frontId") REFERENCES "work_fronts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_allocations" ADD CONSTRAINT "driver_allocations_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "planting_seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planting_areas" ADD CONSTRAINT "planting_areas_frontId_fkey" FOREIGN KEY ("frontId") REFERENCES "work_fronts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planting_areas" ADD CONSTRAINT "planting_areas_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "planting_seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planting_expenses" ADD CONSTRAINT "planting_expenses_frontId_fkey" FOREIGN KEY ("frontId") REFERENCES "work_fronts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planting_expenses" ADD CONSTRAINT "planting_expenses_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "planting_seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planting_expenses" ADD CONSTRAINT "planting_expenses_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planting_expenses" ADD CONSTRAINT "planting_expenses_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "financial_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
