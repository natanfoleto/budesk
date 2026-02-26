-- CreateEnum
CREATE TYPE "RHPaymentStatus" AS ENUM ('SIMULADO', 'PENDENTE', 'PAGO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "RHPaymentType" AS ENUM ('SALARIO', 'DIARIA', 'COMISSAO', 'BONUS', 'RESCISAO', 'FERIAS', 'DECIMO_TERCEIRO');

-- CreateEnum
CREATE TYPE "VacationStatus" AS ENUM ('PREVISTA', 'APROVADA', 'GOZADA', 'PAGA');

-- CreateEnum
CREATE TYPE "ThirteenthStatus" AS ENUM ('PENDENTE', 'PARCIAL', 'PAGO');

-- CreateEnum
CREATE TYPE "AttendanceType" AS ENUM ('PRESENCA', 'FALTA', 'FALTA_JUSTIFICADA', 'ATESTADO');

-- AlterTable: Add rhPaymentId to financial_transactions
ALTER TABLE "financial_transactions" ADD COLUMN "rhPaymentId" TEXT;
CREATE UNIQUE INDEX "financial_transactions_rhPaymentId_key" ON "financial_transactions"("rhPaymentId");

-- CreateTable: rh_payments
CREATE TABLE "rh_payments" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "competencia" TEXT NOT NULL,
    "tipoPagamento" "RHPaymentType" NOT NULL,
    "salarioBase" DECIMAL(10,2) NOT NULL,
    "adicionais" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "horasExtras" DECIMAL(4,2) NOT NULL DEFAULT 0,
    "valorHorasExtras" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "descontos" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "valorAdiantamentos" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalBruto" DECIMAL(10,2) NOT NULL,
    "totalLiquido" DECIMAL(10,2) NOT NULL,
    "status" "RHPaymentStatus" NOT NULL DEFAULT 'PENDENTE',
    "dataPagamento" TIMESTAMP(3),
    "formaPagamento" "PaymentMethod",
    "centroCusto" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rh_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex for rh_payments
CREATE INDEX "rh_payments_employeeId_idx" ON "rh_payments"("employeeId");
CREATE INDEX "rh_payments_competencia_idx" ON "rh_payments"("competencia");
CREATE INDEX "rh_payments_status_idx" ON "rh_payments"("status");

-- CreateTable: salary_histories
CREATE TABLE "salary_histories" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "salarioAnterior" DECIMAL(10,2) NOT NULL,
    "novoSalario" DECIMAL(10,2) NOT NULL,
    "percentualAumento" DECIMAL(5,2) NOT NULL,
    "motivo" TEXT,
    "dataVigencia" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "salary_histories_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "salary_histories_employeeId_idx" ON "salary_histories"("employeeId");

-- CreateTable: vacations
CREATE TABLE "vacations" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "periodoAquisitivoInicio" TIMESTAMP(3) NOT NULL,
    "periodoAquisitivoFim" TIMESTAMP(3) NOT NULL,
    "diasDireito" INTEGER NOT NULL DEFAULT 30,
    "diasUtilizados" INTEGER NOT NULL DEFAULT 0,
    "dataInicio" TIMESTAMP(3),
    "dataFim" TIMESTAMP(3),
    "valorFerias" DECIMAL(10,2),
    "adicionalUmTerco" DECIMAL(10,2),
    "status" "VacationStatus" NOT NULL DEFAULT 'PREVISTA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vacations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "vacations_employeeId_idx" ON "vacations"("employeeId");

-- CreateTable: thirteenth_salaries
CREATE TABLE "thirteenth_salaries" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "anoReferencia" INTEGER NOT NULL,
    "mesesTrabalhados" INTEGER NOT NULL,
    "valorTotal" DECIMAL(10,2) NOT NULL,
    "primeiraParcela" DECIMAL(10,2),
    "segundaParcela" DECIMAL(10,2),
    "primeiraPaga" BOOLEAN NOT NULL DEFAULT false,
    "segundaPaga" BOOLEAN NOT NULL DEFAULT false,
    "status" "ThirteenthStatus" NOT NULL DEFAULT 'PENDENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "thirteenth_salaries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "thirteenth_salaries_employeeId_anoReferencia_key" ON "thirteenth_salaries"("employeeId", "anoReferencia");
CREATE INDEX "thirteenth_salaries_employeeId_idx" ON "thirteenth_salaries"("employeeId");

-- CreateTable: time_bank
CREATE TABLE "time_bank" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "saldoHoras" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "horasCredito" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "horasDebito" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_bank_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "time_bank_employeeId_key" ON "time_bank"("employeeId");

-- CreateTable: attendance_records
CREATE TABLE "attendance_records" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "tipo" "AttendanceType" NOT NULL,
    "horasTrabalhadas" DECIMAL(4,2),
    "horasExtras" DECIMAL(4,2),
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "attendance_records_employeeId_data_key" ON "attendance_records"("employeeId", "data");
CREATE INDEX "attendance_records_employeeId_idx" ON "attendance_records"("employeeId");
CREATE INDEX "attendance_records_data_idx" ON "attendance_records"("data");

-- CreateTable: employer_contributions
CREATE TABLE "employer_contributions" (
    "id" TEXT NOT NULL,
    "pagamentoId" TEXT NOT NULL,
    "inssEmpresa" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "fgts" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "outrosEncargos" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalEncargosEmpresa" DECIMAL(10,2) NOT NULL,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employer_contributions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "employer_contributions_pagamentoId_key" ON "employer_contributions"("pagamentoId");
CREATE UNIQUE INDEX "employer_contributions_transactionId_key" ON "employer_contributions"("transactionId");

-- CreateTable: project_allocations
CREATE TABLE "project_allocations" (
    "id" TEXT NOT NULL,
    "pagamentoId" TEXT NOT NULL,
    "projetoId" TEXT NOT NULL,
    "percentualRateio" DECIMAL(5,2) NOT NULL,
    "valorRateado" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_allocations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "project_allocations_pagamentoId_idx" ON "project_allocations"("pagamentoId");

-- AddForeignKey: rh_payments -> employees
ALTER TABLE "rh_payments" ADD CONSTRAINT "rh_payments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: financial_transactions -> rh_payments
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_rhPaymentId_fkey" FOREIGN KEY ("rhPaymentId") REFERENCES "rh_payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: salary_histories -> employees
ALTER TABLE "salary_histories" ADD CONSTRAINT "salary_histories_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: vacations -> employees
ALTER TABLE "vacations" ADD CONSTRAINT "vacations_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: thirteenth_salaries -> employees
ALTER TABLE "thirteenth_salaries" ADD CONSTRAINT "thirteenth_salaries_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: time_bank -> employees
ALTER TABLE "time_bank" ADD CONSTRAINT "time_bank_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: attendance_records -> employees
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: employer_contributions -> rh_payments
ALTER TABLE "employer_contributions" ADD CONSTRAINT "employer_contributions_pagamentoId_fkey" FOREIGN KEY ("pagamentoId") REFERENCES "rh_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: project_allocations -> rh_payments
ALTER TABLE "project_allocations" ADD CONSTRAINT "project_allocations_pagamentoId_fkey" FOREIGN KEY ("pagamentoId") REFERENCES "rh_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
