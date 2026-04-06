-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."AccountStatus" AS ENUM ('PENDENTE', 'PAGA', 'ATRASADA');

-- CreateEnum
CREATE TYPE "public"."AttachmentType" AS ENUM ('BOLETO', 'COMPROVANTE', 'NOTA_FISCAL', 'CONTRATO', 'OUTROS', 'FATURA');

-- CreateEnum
CREATE TYPE "public"."AttendanceType" AS ENUM ('PRESENCA', 'FALTA', 'FALTA_JUSTIFICADA', 'ATESTADO', 'DECLARACAO', 'AFASTAMENTO', 'FOLGA');

-- CreateEnum
CREATE TYPE "public"."AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN');

-- CreateEnum
CREATE TYPE "public"."ContractStatus" AS ENUM ('ACTIVE', 'FINISHED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "public"."EmployeeAccountType" AS ENUM ('BANCARIA', 'PIX_CPF', 'PIX_TELEFONE', 'PIX_EMAIL', 'PIX_CHAVE_ALEATORIA');

-- CreateEnum
CREATE TYPE "public"."ExpenseCategory" AS ENUM ('ALIMENTACAO', 'COMBUSTIVEL', 'EQUIPAMENTOS', 'MANUTENCAO', 'PECAS', 'SALARIO', 'SERVICOS', 'OUTROS');

-- CreateEnum
CREATE TYPE "public"."MaintenancePriority" AS ENUM ('BAIXA', 'MEDIA', 'ALTA');

-- CreateEnum
CREATE TYPE "public"."MaintenanceStatus" AS ENUM ('PENDENTE', 'AGENDADA', 'REALIZADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "public"."MaintenanceType" AS ENUM ('PREVENTIVA', 'CORRETIVA', 'PREDITIVA');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('DINHEIRO', 'PIX', 'CARTAO', 'BOLETO', 'CHEQUE', 'TRANSFERENCIA');

-- CreateEnum
CREATE TYPE "public"."PersonType" AS ENUM ('PHYSICAL', 'LEGAL');

-- CreateEnum
CREATE TYPE "public"."PlantingProductionType" AS ENUM ('PLANTIO', 'CORTE');

-- CreateEnum
CREATE TYPE "public"."RHPaymentStatus" AS ENUM ('SIMULADO', 'PENDENTE', 'PAGO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "public"."RHPaymentType" AS ENUM ('SALARIO', 'DIARIA', 'COMISSAO', 'BONUS', 'RESCISAO', 'FERIAS', 'DECIMO_TERCEIRO');

-- CreateEnum
CREATE TYPE "public"."ServiceStatus" AS ENUM ('ABERTO', 'EM_ANDAMENTO', 'FINALIZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "public"."ShirtSize" AS ENUM ('P', 'M', 'G', 'GG', 'XGG');

-- CreateEnum
CREATE TYPE "public"."SupplierAccountType" AS ENUM ('CHECKING', 'SAVINGS', 'PIX');

-- CreateEnum
CREATE TYPE "public"."ThirteenthStatus" AS ENUM ('PENDENTE', 'PARCIAL', 'PAGO');

-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('ENTRADA', 'SAIDA');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ROOT', 'ADMIN', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "public"."VacationStatus" AS ENUM ('PREVISTA', 'APROVADA', 'GOZADA', 'PAGA');

-- CreateEnum
CREATE TYPE "public"."VehicleOwnership" AS ENUM ('EMPRESA', 'TERCEIRO');

-- CreateEnum
CREATE TYPE "public"."VehicleType" AS ENUM ('CAMINHAO', 'ONIBUS', 'MAQUINA', 'OUTRO', 'CARRO', 'UTILITARIO', 'CAMINHONETE', 'VAN', 'SUV', 'MOTO', 'MICRO_ONIBUS', 'CAMINHAO_3_4', 'CAMINHAO_TOCO', 'CAMINHAO_TRUCK', 'CARRETA', 'BITREM', 'RODOTREM', 'TRATOR', 'RETROESCAVADEIRA', 'PA_CARREGADEIRA', 'ESCAVADEIRA', 'MOTONIVELADORA', 'ROLO_COMPACTADOR', 'REBOQUE', 'SEMIRREBOQUE', 'PRANCHA', 'TANQUE', 'COLHEITADEIRA', 'PULVERIZADOR', 'EMPILHADEIRA');

-- CreateTable
CREATE TABLE "public"."account_installment_attachments" (
    "id" TEXT NOT NULL,
    "installment_id" TEXT NOT NULL,
    "type" "public"."AttachmentType" NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_installment_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."account_installments" (
    "id" TEXT NOT NULL,
    "account_payable_id" TEXT NOT NULL,
    "installment_number" INTEGER NOT NULL,
    "value_in_cents" INTEGER NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "status" "public"."AccountStatus" NOT NULL DEFAULT 'PENDENTE',
    "payment_date" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "transaction_id" TEXT,

    CONSTRAINT "account_installments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."accounts_payable" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "supplierId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "costCenterId" TEXT,
    "installments_count" INTEGER NOT NULL DEFAULT 1,
    "payment_method" "public"."PaymentMethod" NOT NULL DEFAULT 'BOLETO',
    "total_value_in_cents" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "attachment_url" TEXT,
    "category" "public"."ExpenseCategory" NOT NULL DEFAULT 'OUTROS',
    "user_id" TEXT,
    "invoice_url" TEXT,

    CONSTRAINT "accounts_payable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."attendance_records" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "type" "public"."AttendanceType" NOT NULL,
    "workedHours" DECIMAL(4,2),
    "overtimeHours" DECIMAL(4,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeBankImpact" DECIMAL(4,2),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" "public"."AuditAction" NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "oldData" JSONB,
    "newData" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."clients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "address" TEXT,
    "document" TEXT,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cost_centers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cost_centers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."daily_wages" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "employeeId" TEXT NOT NULL,
    "frontId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "valueInCents" INTEGER NOT NULL,
    "presence" "public"."AttendanceType" NOT NULL DEFAULT 'PRESENCA',
    "notes" TEXT,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_wages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."documents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "fileUrl" TEXT NOT NULL,
    "serviceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT,
    "description" TEXT,
    "vehicleId" TEXT,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."driver_allocations" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "employeeId" TEXT NOT NULL,
    "frontId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "valueInCents" INTEGER NOT NULL,
    "notes" TEXT,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "vehicleId" TEXT,

    CONSTRAINT "driver_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."employee_accounts" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "type" "public"."EmployeeAccountType" NOT NULL,
    "identifier" TEXT NOT NULL,
    "description" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."employee_advances" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "amount_in_cents" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "payrollReference" TEXT,
    "transactionId" TEXT,

    CONSTRAINT "employee_advances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."employee_contracts" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "public"."ContractStatus" NOT NULL DEFAULT 'ACTIVE',
    "description" TEXT,
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "value_in_cents" INTEGER NOT NULL,

    CONSTRAINT "employee_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."employee_tag_on_employee" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "employee_tag_on_employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."employee_tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."employees" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "birthDate" TIMESTAMP(3),
    "document" TEXT,
    "email" TEXT,
    "gender" TEXT,
    "pantsSize" TEXT,
    "phone" TEXT,
    "rg" TEXT,
    "salary_in_cents" INTEGER,
    "shirtSize" "public"."ShirtSize",
    "shoeSize" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "planting_category" TEXT,
    "job_id" TEXT,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."employer_contributions" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "companyInssInCents" INTEGER NOT NULL DEFAULT 0,
    "fgtsInCents" INTEGER NOT NULL DEFAULT 0,
    "otherTaxesInCents" INTEGER NOT NULL DEFAULT 0,
    "totalCompanyTaxesInCents" INTEGER NOT NULL,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employer_contributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."employment_records" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "admissionDate" TIMESTAMP(3) NOT NULL,
    "terminationDate" TIMESTAMP(3),
    "jobTitle" TEXT NOT NULL,
    "base_salary_in_cents" INTEGER NOT NULL,
    "contractType" TEXT NOT NULL,
    "weeklyWorkload" INTEGER,
    "workRegime" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "hasMedicalExam" BOOLEAN NOT NULL DEFAULT false,
    "hasSignedEpiReceipt" BOOLEAN NOT NULL DEFAULT false,
    "hasSignedRegistration" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "employment_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."financial_transactions" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "public"."TransactionType" NOT NULL,
    "category" "public"."ExpenseCategory" NOT NULL,
    "paymentMethod" "public"."PaymentMethod" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "serviceId" TEXT,
    "employeeId" TEXT,
    "supplierId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "value_in_cents" INTEGER NOT NULL,
    "maintenanceId" TEXT,
    "rhPaymentId" TEXT,
    "costCenterId" TEXT,
    "attachment_url" TEXT,
    "conciled" BOOLEAN NOT NULL DEFAULT false,
    "user_id" TEXT,

    CONSTRAINT "financial_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."jobs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."login_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."maintenances" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "type" "public"."MaintenanceType" NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "public"."MaintenancePriority" NOT NULL,
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
    "supplierId" TEXT,
    "invoiceNumber" TEXT,
    "status" "public"."MaintenanceStatus" NOT NULL DEFAULT 'PENDENTE',
    "internalNotes" TEXT,
    "attachments" JSONB,
    "approvalResponsible" TEXT,
    "downtimeDays" INTEGER,
    "operationalImpact" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "costCenterId" TEXT,

    CONSTRAINT "maintenances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."planting_advances" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "employeeId" TEXT NOT NULL,
    "frontId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "valueInCents" INTEGER NOT NULL,
    "notes" TEXT,
    "discountInCurrentFortnight" BOOLEAN NOT NULL DEFAULT true,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "account_id" TEXT,

    CONSTRAINT "planting_advances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."planting_areas" (
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
CREATE TABLE "public"."planting_expenses" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "frontId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "category" "public"."ExpenseCategory" NOT NULL,
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
    "supplierId" TEXT,

    CONSTRAINT "planting_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."planting_parameters" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planting_parameters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."planting_productions" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "employeeId" TEXT NOT NULL,
    "frontId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "type" "public"."PlantingProductionType" NOT NULL,
    "meters" DECIMAL(10,2),
    "meterValueInCents" INTEGER NOT NULL,
    "totalValueInCents" INTEGER NOT NULL,
    "presence" "public"."AttendanceType" NOT NULL DEFAULT 'PRESENCA',
    "notes" TEXT,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planting_productions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."planting_seasons" (
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
CREATE TABLE "public"."project_allocations" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "allocationPercentage" DECIMAL(5,2) NOT NULL,
    "allocatedAmountInCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rh_payments" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "competenceMonth" TEXT NOT NULL,
    "paymentType" "public"."RHPaymentType" NOT NULL,
    "baseSalaryInCents" INTEGER NOT NULL,
    "additionsInCents" INTEGER NOT NULL DEFAULT 0,
    "overtimeHours" DECIMAL(4,2) NOT NULL DEFAULT 0,
    "overtimeValueInCents" INTEGER NOT NULL DEFAULT 0,
    "discountsInCents" INTEGER NOT NULL DEFAULT 0,
    "advancesValueInCents" INTEGER NOT NULL DEFAULT 0,
    "grossTotalInCents" INTEGER NOT NULL,
    "netTotalInCents" INTEGER NOT NULL,
    "status" "public"."RHPaymentStatus" NOT NULL DEFAULT 'PENDENTE',
    "paymentDate" TIMESTAMP(3),
    "paymentMethod" "public"."PaymentMethod",
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "costCenterId" TEXT,

    CONSTRAINT "rh_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."salary_histories" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "previousSalaryInCents" INTEGER NOT NULL,
    "newSalaryInCents" INTEGER NOT NULL,
    "increasePercentage" DECIMAL(5,2) NOT NULL,
    "reason" TEXT,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "salary_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."services" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "public"."ServiceStatus" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "clientId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."suppliers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" TEXT,
    "document" TEXT,
    "account" TEXT,
    "accountType" "public"."SupplierAccountType",
    "active" BOOLEAN NOT NULL DEFAULT true,
    "bank" TEXT,
    "branch" TEXT,
    "city" TEXT,
    "complement" TEXT,
    "contactName" TEXT,
    "mobile" TEXT,
    "municipalRegistration" TEXT,
    "neighborhood" TEXT,
    "notes" TEXT,
    "number" TEXT,
    "personType" "public"."PersonType" NOT NULL DEFAULT 'LEGAL',
    "pixKey" TEXT,
    "state" TEXT,
    "stateRegistration" TEXT,
    "street" TEXT,
    "tradeName" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "zipCode" TEXT,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."thirteenth_salaries" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "referenceYear" INTEGER NOT NULL,
    "workedMonths" INTEGER NOT NULL,
    "totalAmountInCents" INTEGER NOT NULL,
    "firstInstallmentInCents" INTEGER,
    "secondInstallmentInCents" INTEGER,
    "firstInstallmentPaid" BOOLEAN NOT NULL DEFAULT false,
    "secondInstallmentPaid" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."ThirteenthStatus" NOT NULL DEFAULT 'PENDENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "thirteenth_salaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."time_bank" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "balanceHours" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "creditHours" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "debitHours" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_bank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vacations" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "vestingPeriodStart" TIMESTAMP(3) NOT NULL,
    "vestingPeriodEnd" TIMESTAMP(3) NOT NULL,
    "entitledDays" INTEGER NOT NULL DEFAULT 30,
    "usedDays" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "vacationAmountInCents" INTEGER,
    "oneThirdBonusInCents" INTEGER,
    "status" "public"."VacationStatus" NOT NULL DEFAULT 'PREVISTA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vacations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vehicle_usages" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "cost_in_cents" INTEGER NOT NULL,
    "note" TEXT,
    "costCenterId" TEXT,

    CONSTRAINT "vehicle_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vehicles" (
    "id" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."VehicleType" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "brand" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "document_url" TEXT,
    "color" TEXT,
    "nickname" TEXT,
    "ownerName" TEXT,
    "ownership" "public"."VehicleOwnership" NOT NULL DEFAULT 'EMPRESA',

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."work_fronts" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_fronts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "account_installments_account_payable_id_idx" ON "public"."account_installments"("account_payable_id" ASC);

-- CreateIndex
CREATE INDEX "account_installments_due_date_idx" ON "public"."account_installments"("due_date" ASC);

-- CreateIndex
CREATE INDEX "account_installments_status_idx" ON "public"."account_installments"("status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "account_installments_transaction_id_key" ON "public"."account_installments"("transaction_id" ASC);

-- CreateIndex
CREATE INDEX "accounts_payable_supplierId_idx" ON "public"."accounts_payable"("supplierId" ASC);

-- CreateIndex
CREATE INDEX "attendance_records_date_idx" ON "public"."attendance_records"("date" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_employeeId_date_key" ON "public"."attendance_records"("employeeId" ASC, "date" ASC);

-- CreateIndex
CREATE INDEX "attendance_records_employeeId_idx" ON "public"."attendance_records"("employeeId" ASC);

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "public"."audit_logs"("action" ASC);

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "public"."audit_logs"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "audit_logs_entity_idx" ON "public"."audit_logs"("entity" ASC);

-- CreateIndex
CREATE INDEX "daily_wages_date_idx" ON "public"."daily_wages"("date" ASC);

-- CreateIndex
CREATE INDEX "daily_wages_employeeId_idx" ON "public"."daily_wages"("employeeId" ASC);

-- CreateIndex
CREATE INDEX "daily_wages_frontId_idx" ON "public"."daily_wages"("frontId" ASC);

-- CreateIndex
CREATE INDEX "documents_category_idx" ON "public"."documents"("category" ASC);

-- CreateIndex
CREATE INDEX "driver_allocations_date_idx" ON "public"."driver_allocations"("date" ASC);

-- CreateIndex
CREATE INDEX "driver_allocations_employeeId_idx" ON "public"."driver_allocations"("employeeId" ASC);

-- CreateIndex
CREATE INDEX "driver_allocations_vehicleId_idx" ON "public"."driver_allocations"("vehicleId" ASC);

-- CreateIndex
CREATE INDEX "employee_advances_employeeId_idx" ON "public"."employee_advances"("employeeId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "employee_advances_transactionId_key" ON "public"."employee_advances"("transactionId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "employee_tag_on_employee_employee_id_tag_id_key" ON "public"."employee_tag_on_employee"("employee_id" ASC, "tag_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "employee_tags_name_key" ON "public"."employee_tags"("name" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "employees_document_key" ON "public"."employees"("document" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "employer_contributions_paymentId_key" ON "public"."employer_contributions"("paymentId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "employer_contributions_transactionId_key" ON "public"."employer_contributions"("transactionId" ASC);

-- CreateIndex
CREATE INDEX "financial_transactions_category_idx" ON "public"."financial_transactions"("category" ASC);

-- CreateIndex
CREATE INDEX "financial_transactions_date_idx" ON "public"."financial_transactions"("date" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "financial_transactions_maintenanceId_key" ON "public"."financial_transactions"("maintenanceId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "financial_transactions_rhPaymentId_key" ON "public"."financial_transactions"("rhPaymentId" ASC);

-- CreateIndex
CREATE INDEX "financial_transactions_supplierId_idx" ON "public"."financial_transactions"("supplierId" ASC);

-- CreateIndex
CREATE INDEX "financial_transactions_type_idx" ON "public"."financial_transactions"("type" ASC);

-- CreateIndex
CREATE INDEX "login_logs_createdAt_idx" ON "public"."login_logs"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "login_logs_email_idx" ON "public"."login_logs"("email" ASC);

-- CreateIndex
CREATE INDEX "planting_advances_date_idx" ON "public"."planting_advances"("date" ASC);

-- CreateIndex
CREATE INDEX "planting_advances_employeeId_idx" ON "public"."planting_advances"("employeeId" ASC);

-- CreateIndex
CREATE INDEX "planting_advances_frontId_idx" ON "public"."planting_advances"("frontId" ASC);

-- CreateIndex
CREATE INDEX "planting_areas_date_idx" ON "public"."planting_areas"("date" ASC);

-- CreateIndex
CREATE INDEX "planting_areas_frontId_idx" ON "public"."planting_areas"("frontId" ASC);

-- CreateIndex
CREATE INDEX "planting_expenses_category_idx" ON "public"."planting_expenses"("category" ASC);

-- CreateIndex
CREATE INDEX "planting_expenses_date_idx" ON "public"."planting_expenses"("date" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "planting_expenses_transactionId_key" ON "public"."planting_expenses"("transactionId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "planting_parameters_key_key" ON "public"."planting_parameters"("key" ASC);

-- CreateIndex
CREATE INDEX "planting_productions_date_idx" ON "public"."planting_productions"("date" ASC);

-- CreateIndex
CREATE INDEX "planting_productions_employeeId_idx" ON "public"."planting_productions"("employeeId" ASC);

-- CreateIndex
CREATE INDEX "planting_productions_frontId_idx" ON "public"."planting_productions"("frontId" ASC);

-- CreateIndex
CREATE INDEX "project_allocations_paymentId_idx" ON "public"."project_allocations"("paymentId" ASC);

-- CreateIndex
CREATE INDEX "rh_payments_competenceMonth_idx" ON "public"."rh_payments"("competenceMonth" ASC);

-- CreateIndex
CREATE INDEX "rh_payments_employeeId_idx" ON "public"."rh_payments"("employeeId" ASC);

-- CreateIndex
CREATE INDEX "rh_payments_status_idx" ON "public"."rh_payments"("status" ASC);

-- CreateIndex
CREATE INDEX "salary_histories_employeeId_idx" ON "public"."salary_histories"("employeeId" ASC);

-- CreateIndex
CREATE INDEX "services_startDate_idx" ON "public"."services"("startDate" ASC);

-- CreateIndex
CREATE INDEX "services_status_idx" ON "public"."services"("status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_document_key" ON "public"."suppliers"("document" ASC);

-- CreateIndex
CREATE INDEX "thirteenth_salaries_employeeId_idx" ON "public"."thirteenth_salaries"("employeeId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "thirteenth_salaries_employeeId_referenceYear_key" ON "public"."thirteenth_salaries"("employeeId" ASC, "referenceYear" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "time_bank_employeeId_key" ON "public"."time_bank"("employeeId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email" ASC);

-- CreateIndex
CREATE INDEX "vacations_employeeId_idx" ON "public"."vacations"("employeeId" ASC);

-- CreateIndex
CREATE INDEX "vehicle_usages_serviceId_idx" ON "public"."vehicle_usages"("serviceId" ASC);

-- CreateIndex
CREATE INDEX "vehicle_usages_vehicleId_idx" ON "public"."vehicle_usages"("vehicleId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_plate_key" ON "public"."vehicles"("plate" ASC);

-- AddForeignKey
ALTER TABLE "public"."account_installment_attachments" ADD CONSTRAINT "account_installment_attachments_installment_id_fkey" FOREIGN KEY ("installment_id") REFERENCES "public"."account_installments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."account_installments" ADD CONSTRAINT "account_installments_account_payable_id_fkey" FOREIGN KEY ("account_payable_id") REFERENCES "public"."accounts_payable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."account_installments" ADD CONSTRAINT "account_installments_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."financial_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."accounts_payable" ADD CONSTRAINT "accounts_payable_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "public"."cost_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."accounts_payable" ADD CONSTRAINT "accounts_payable_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."accounts_payable" ADD CONSTRAINT "accounts_payable_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendance_records" ADD CONSTRAINT "attendance_records_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."daily_wages" ADD CONSTRAINT "daily_wages_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."daily_wages" ADD CONSTRAINT "daily_wages_frontId_fkey" FOREIGN KEY ("frontId") REFERENCES "public"."work_fronts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."daily_wages" ADD CONSTRAINT "daily_wages_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "public"."planting_seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "public"."vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."driver_allocations" ADD CONSTRAINT "driver_allocations_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."driver_allocations" ADD CONSTRAINT "driver_allocations_frontId_fkey" FOREIGN KEY ("frontId") REFERENCES "public"."work_fronts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."driver_allocations" ADD CONSTRAINT "driver_allocations_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "public"."planting_seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."driver_allocations" ADD CONSTRAINT "driver_allocations_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "public"."vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employee_accounts" ADD CONSTRAINT "employee_accounts_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employee_advances" ADD CONSTRAINT "employee_advances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employee_advances" ADD CONSTRAINT "employee_advances_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "public"."financial_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employee_contracts" ADD CONSTRAINT "employee_contracts_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employee_tag_on_employee" ADD CONSTRAINT "employee_tag_on_employee_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employee_tag_on_employee" ADD CONSTRAINT "employee_tag_on_employee_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."employee_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employees" ADD CONSTRAINT "employees_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employer_contributions" ADD CONSTRAINT "employer_contributions_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."rh_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employment_records" ADD CONSTRAINT "employment_records_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."financial_transactions" ADD CONSTRAINT "financial_transactions_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "public"."cost_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."financial_transactions" ADD CONSTRAINT "financial_transactions_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."financial_transactions" ADD CONSTRAINT "financial_transactions_maintenanceId_fkey" FOREIGN KEY ("maintenanceId") REFERENCES "public"."maintenances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."financial_transactions" ADD CONSTRAINT "financial_transactions_rhPaymentId_fkey" FOREIGN KEY ("rhPaymentId") REFERENCES "public"."rh_payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."financial_transactions" ADD CONSTRAINT "financial_transactions_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."financial_transactions" ADD CONSTRAINT "financial_transactions_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."financial_transactions" ADD CONSTRAINT "financial_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."login_logs" ADD CONSTRAINT "login_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."maintenances" ADD CONSTRAINT "maintenances_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "public"."cost_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."maintenances" ADD CONSTRAINT "maintenances_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."maintenances" ADD CONSTRAINT "maintenances_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "public"."vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."planting_advances" ADD CONSTRAINT "planting_advances_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."employee_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."planting_advances" ADD CONSTRAINT "planting_advances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."planting_advances" ADD CONSTRAINT "planting_advances_frontId_fkey" FOREIGN KEY ("frontId") REFERENCES "public"."work_fronts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."planting_advances" ADD CONSTRAINT "planting_advances_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "public"."planting_seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."planting_areas" ADD CONSTRAINT "planting_areas_frontId_fkey" FOREIGN KEY ("frontId") REFERENCES "public"."work_fronts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."planting_areas" ADD CONSTRAINT "planting_areas_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "public"."planting_seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."planting_expenses" ADD CONSTRAINT "planting_expenses_frontId_fkey" FOREIGN KEY ("frontId") REFERENCES "public"."work_fronts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."planting_expenses" ADD CONSTRAINT "planting_expenses_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "public"."planting_seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."planting_expenses" ADD CONSTRAINT "planting_expenses_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."planting_expenses" ADD CONSTRAINT "planting_expenses_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "public"."financial_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."planting_expenses" ADD CONSTRAINT "planting_expenses_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "public"."vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."planting_productions" ADD CONSTRAINT "planting_productions_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."planting_productions" ADD CONSTRAINT "planting_productions_frontId_fkey" FOREIGN KEY ("frontId") REFERENCES "public"."work_fronts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."planting_productions" ADD CONSTRAINT "planting_productions_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "public"."planting_seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_allocations" ADD CONSTRAINT "project_allocations_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."rh_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_allocations" ADD CONSTRAINT "project_allocations_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rh_payments" ADD CONSTRAINT "rh_payments_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "public"."cost_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rh_payments" ADD CONSTRAINT "rh_payments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."salary_histories" ADD CONSTRAINT "salary_histories_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."services" ADD CONSTRAINT "services_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."services" ADD CONSTRAINT "services_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."thirteenth_salaries" ADD CONSTRAINT "thirteenth_salaries_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."time_bank" ADD CONSTRAINT "time_bank_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vacations" ADD CONSTRAINT "vacations_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vehicle_usages" ADD CONSTRAINT "vehicle_usages_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "public"."cost_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vehicle_usages" ADD CONSTRAINT "vehicle_usages_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vehicle_usages" ADD CONSTRAINT "vehicle_usages_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "public"."vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."work_fronts" ADD CONSTRAINT "work_fronts_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "public"."planting_seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
