-- 1. DROP CONSTRAINTS AND INDEXES

-- DropForeignKey
ALTER TABLE "employer_contributions" DROP CONSTRAINT "employer_contributions_pagamentoId_fkey";

-- DropForeignKey
ALTER TABLE "project_allocations" DROP CONSTRAINT "project_allocations_pagamentoId_fkey";

-- DropIndex
DROP INDEX "rh_payments_competencia_idx";

-- DropIndex
DROP INDEX "thirteenth_salaries_employeeId_anoReferencia_key";

-- DropIndex
DROP INDEX "attendance_records_data_idx";

-- DropIndex
DROP INDEX "attendance_records_employeeId_data_key";

-- DropIndex
DROP INDEX "employer_contributions_pagamentoId_key";

-- DropIndex
DROP INDEX "project_allocations_pagamentoId_idx";


-- 2. CREATE COST CENTERS & PRESERVE STRINGS

-- CreateTable
CREATE TABLE "cost_centers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cost_centers_pkey" PRIMARY KEY ("id")
);

-- Extract from existing strings
INSERT INTO "cost_centers" ("id", "name", "updatedAt")
SELECT gen_random_uuid()::text, "name", CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT "costCenter" AS "name" FROM "maintenances" WHERE "costCenter" IS NOT NULL
  UNION
  SELECT DISTINCT "centroCusto" AS "name" FROM "rh_payments" WHERE "centroCusto" IS NOT NULL
) AS distinct_centers;


-- 3. RENAME COLUMNS AND CAST DECIMALS TO INTEGER CENTS

-- employee_advances
ALTER TABLE "employee_advances" RENAME COLUMN "amount" TO "amount_in_cents";
ALTER TABLE "employee_advances" ALTER COLUMN "amount_in_cents" TYPE INTEGER USING ("amount_in_cents" * 100)::integer;

-- employment_records
ALTER TABLE "employment_records" RENAME COLUMN "baseSalary" TO "base_salary_in_cents";
ALTER TABLE "employment_records" ALTER COLUMN "base_salary_in_cents" TYPE INTEGER USING ("base_salary_in_cents" * 100)::integer;

-- vehicle_usages
ALTER TABLE "vehicle_usages" ADD COLUMN "costCenterId" TEXT;
ALTER TABLE "vehicle_usages" RENAME COLUMN "cost" TO "cost_in_cents";
ALTER TABLE "vehicle_usages" ALTER COLUMN "cost_in_cents" TYPE INTEGER USING ("cost_in_cents" * 100)::integer;

-- maintenances
ALTER TABLE "maintenances" ADD COLUMN "costCenterId" TEXT;
UPDATE "maintenances" m SET "costCenterId" = c."id" FROM "cost_centers" c WHERE m."costCenter" = c."name";
ALTER TABLE "maintenances" DROP COLUMN "costCenter";

-- rh_payments
ALTER TABLE "rh_payments" RENAME COLUMN "adicionais" TO "additionsInCents";
ALTER TABLE "rh_payments" ALTER COLUMN "additionsInCents" TYPE INTEGER USING ("additionsInCents" * 100)::integer;

ALTER TABLE "rh_payments" ADD COLUMN "costCenterId" TEXT;
UPDATE "rh_payments" r SET "costCenterId" = c."id" FROM "cost_centers" c WHERE r."centroCusto" = c."name";
ALTER TABLE "rh_payments" DROP COLUMN "centroCusto";

ALTER TABLE "rh_payments" RENAME COLUMN "competencia" TO "competenceMonth";
ALTER TABLE "rh_payments" RENAME COLUMN "dataPagamento" TO "paymentDate";
ALTER TABLE "rh_payments" RENAME COLUMN "formaPagamento" TO "paymentMethod";

ALTER TABLE "rh_payments" RENAME COLUMN "descontos" TO "discountsInCents";
ALTER TABLE "rh_payments" ALTER COLUMN "discountsInCents" TYPE INTEGER USING ("discountsInCents" * 100)::integer;

ALTER TABLE "rh_payments" RENAME COLUMN "horasExtras" TO "overtimeHours";

ALTER TABLE "rh_payments" RENAME COLUMN "salarioBase" TO "baseSalaryInCents";
ALTER TABLE "rh_payments" ALTER COLUMN "baseSalaryInCents" TYPE INTEGER USING ("baseSalaryInCents" * 100)::integer;

ALTER TABLE "rh_payments" RENAME COLUMN "tipoPagamento" TO "paymentType";

ALTER TABLE "rh_payments" RENAME COLUMN "totalBruto" TO "grossTotalInCents";
ALTER TABLE "rh_payments" ALTER COLUMN "grossTotalInCents" TYPE INTEGER USING ("grossTotalInCents" * 100)::integer;

ALTER TABLE "rh_payments" RENAME COLUMN "totalLiquido" TO "netTotalInCents";
ALTER TABLE "rh_payments" ALTER COLUMN "netTotalInCents" TYPE INTEGER USING ("netTotalInCents" * 100)::integer;

ALTER TABLE "rh_payments" RENAME COLUMN "valorAdiantamentos" TO "advancesValueInCents";
ALTER TABLE "rh_payments" ALTER COLUMN "advancesValueInCents" TYPE INTEGER USING ("advancesValueInCents" * 100)::integer;

ALTER TABLE "rh_payments" RENAME COLUMN "valorHorasExtras" TO "overtimeValueInCents";
ALTER TABLE "rh_payments" ALTER COLUMN "overtimeValueInCents" TYPE INTEGER USING ("overtimeValueInCents" * 100)::integer;

ALTER TABLE "rh_payments" RENAME COLUMN "observacoes" TO "notes";

-- salary_histories
ALTER TABLE "salary_histories" RENAME COLUMN "dataVigencia" TO "effectiveDate";
ALTER TABLE "salary_histories" RENAME COLUMN "percentualAumento" TO "increasePercentage";
ALTER TABLE "salary_histories" RENAME COLUMN "motivo" TO "reason";

ALTER TABLE "salary_histories" RENAME COLUMN "novoSalario" TO "newSalaryInCents";
ALTER TABLE "salary_histories" ALTER COLUMN "newSalaryInCents" TYPE INTEGER USING ("newSalaryInCents" * 100)::integer;

ALTER TABLE "salary_histories" RENAME COLUMN "salarioAnterior" TO "previousSalaryInCents";
ALTER TABLE "salary_histories" ALTER COLUMN "previousSalaryInCents" TYPE INTEGER USING ("previousSalaryInCents" * 100)::integer;

-- vacations
ALTER TABLE "vacations" RENAME COLUMN "dataFim" TO "endDate";
ALTER TABLE "vacations" RENAME COLUMN "dataInicio" TO "startDate";
ALTER TABLE "vacations" RENAME COLUMN "diasDireito" TO "entitledDays";
ALTER TABLE "vacations" RENAME COLUMN "diasUtilizados" TO "usedDays";
ALTER TABLE "vacations" RENAME COLUMN "periodoAquisitivoFim" TO "vestingPeriodEnd";
ALTER TABLE "vacations" RENAME COLUMN "periodoAquisitivoInicio" TO "vestingPeriodStart";

ALTER TABLE "vacations" RENAME COLUMN "adicionalUmTerco" TO "oneThirdBonusInCents";
ALTER TABLE "vacations" ALTER COLUMN "oneThirdBonusInCents" TYPE INTEGER USING ("oneThirdBonusInCents" * 100)::integer;

ALTER TABLE "vacations" RENAME COLUMN "valorFerias" TO "vacationAmountInCents";
ALTER TABLE "vacations" ALTER COLUMN "vacationAmountInCents" TYPE INTEGER USING ("vacationAmountInCents" * 100)::integer;

-- thirteenth_salaries
ALTER TABLE "thirteenth_salaries" RENAME COLUMN "anoReferencia" TO "referenceYear";
ALTER TABLE "thirteenth_salaries" RENAME COLUMN "mesesTrabalhados" TO "workedMonths";
ALTER TABLE "thirteenth_salaries" RENAME COLUMN "primeiraPaga" TO "firstInstallmentPaid";
ALTER TABLE "thirteenth_salaries" RENAME COLUMN "segundaPaga" TO "secondInstallmentPaid";

ALTER TABLE "thirteenth_salaries" RENAME COLUMN "primeiraParcela" TO "firstInstallmentInCents";
ALTER TABLE "thirteenth_salaries" ALTER COLUMN "firstInstallmentInCents" TYPE INTEGER USING ("firstInstallmentInCents" * 100)::integer;

ALTER TABLE "thirteenth_salaries" RENAME COLUMN "segundaParcela" TO "secondInstallmentInCents";
ALTER TABLE "thirteenth_salaries" ALTER COLUMN "secondInstallmentInCents" TYPE INTEGER USING ("secondInstallmentInCents" * 100)::integer;

ALTER TABLE "thirteenth_salaries" RENAME COLUMN "valorTotal" TO "totalAmountInCents";
ALTER TABLE "thirteenth_salaries" ALTER COLUMN "totalAmountInCents" TYPE INTEGER USING ("totalAmountInCents" * 100)::integer;

-- time_bank
ALTER TABLE "time_bank" RENAME COLUMN "horasCredito" TO "creditHours";
ALTER TABLE "time_bank" RENAME COLUMN "horasDebito" TO "debitHours";
ALTER TABLE "time_bank" RENAME COLUMN "saldoHoras" TO "balanceHours";

-- attendance_records
ALTER TABLE "attendance_records" RENAME COLUMN "bancoHorasImpacto" TO "timeBankImpact";
ALTER TABLE "attendance_records" RENAME COLUMN "data" TO "date";
ALTER TABLE "attendance_records" RENAME COLUMN "horasExtras" TO "overtimeHours";
ALTER TABLE "attendance_records" RENAME COLUMN "horasTrabalhadas" TO "workedHours";
ALTER TABLE "attendance_records" RENAME COLUMN "observacao" TO "notes";
ALTER TABLE "attendance_records" RENAME COLUMN "tipo" TO "type";

-- employer_contributions
ALTER TABLE "employer_contributions" RENAME COLUMN "pagamentoId" TO "paymentId";

ALTER TABLE "employer_contributions" RENAME COLUMN "fgts" TO "fgtsInCents";
ALTER TABLE "employer_contributions" ALTER COLUMN "fgtsInCents" TYPE INTEGER USING ("fgtsInCents" * 100)::integer;

ALTER TABLE "employer_contributions" RENAME COLUMN "inssEmpresa" TO "companyInssInCents";
ALTER TABLE "employer_contributions" ALTER COLUMN "companyInssInCents" TYPE INTEGER USING ("companyInssInCents" * 100)::integer;

ALTER TABLE "employer_contributions" RENAME COLUMN "outrosEncargos" TO "otherTaxesInCents";
ALTER TABLE "employer_contributions" ALTER COLUMN "otherTaxesInCents" TYPE INTEGER USING ("otherTaxesInCents" * 100)::integer;

ALTER TABLE "employer_contributions" RENAME COLUMN "totalEncargosEmpresa" TO "totalCompanyTaxesInCents";
ALTER TABLE "employer_contributions" ALTER COLUMN "totalCompanyTaxesInCents" TYPE INTEGER USING ("totalCompanyTaxesInCents" * 100)::integer;

-- project_allocations
ALTER TABLE "project_allocations" RENAME COLUMN "pagamentoId" TO "paymentId";
ALTER TABLE "project_allocations" RENAME COLUMN "percentualRateio" TO "allocationPercentage";
ALTER TABLE "project_allocations" RENAME COLUMN "projetoId" TO "serviceId";

ALTER TABLE "project_allocations" RENAME COLUMN "valorRateado" TO "allocatedAmountInCents";
ALTER TABLE "project_allocations" ALTER COLUMN "allocatedAmountInCents" TYPE INTEGER USING ("allocatedAmountInCents" * 100)::integer;

-- accounts_payable
ALTER TABLE "accounts_payable" ADD COLUMN "costCenterId" TEXT;

-- financial_transactions
ALTER TABLE "financial_transactions" ADD COLUMN "costCenterId" TEXT;


-- 4. CREATE NEW INDEXES AND CONSTRAINTS (copied from Prisma DRAFT)

-- CreateIndex
CREATE INDEX "rh_payments_competenceMonth_idx" ON "rh_payments"("competenceMonth");

-- CreateIndex
CREATE UNIQUE INDEX "thirteenth_salaries_employeeId_referenceYear_key" ON "thirteenth_salaries"("employeeId", "referenceYear");

-- CreateIndex
CREATE INDEX "attendance_records_date_idx" ON "attendance_records"("date");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_employeeId_date_key" ON "attendance_records"("employeeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "employer_contributions_paymentId_key" ON "employer_contributions"("paymentId");

-- CreateIndex
CREATE INDEX "project_allocations_paymentId_idx" ON "project_allocations"("paymentId");

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "cost_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "cost_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_usages" ADD CONSTRAINT "vehicle_usages_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "cost_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenances" ADD CONSTRAINT "maintenances_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "cost_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rh_payments" ADD CONSTRAINT "rh_payments_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "cost_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employer_contributions" ADD CONSTRAINT "employer_contributions_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "rh_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_allocations" ADD CONSTRAINT "project_allocations_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "rh_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_allocations" ADD CONSTRAINT "project_allocations_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
