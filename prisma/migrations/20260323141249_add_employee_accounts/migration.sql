-- CreateEnum
CREATE TYPE "EmployeeAccountType" AS ENUM ('BANCARIA', 'PIX_CPF', 'PIX_TELEFONE', 'PIX_EMAIL', 'PIX_CHAVE_ALEATORIA');

-- AlterTable
ALTER TABLE "planting_advances" ADD COLUMN     "account_id" TEXT;

-- CreateTable
CREATE TABLE "employee_accounts" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "type" "EmployeeAccountType" NOT NULL,
    "identifier" TEXT NOT NULL,
    "description" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_accounts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "planting_advances" ADD CONSTRAINT "planting_advances_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "employee_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_accounts" ADD CONSTRAINT "employee_accounts_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
