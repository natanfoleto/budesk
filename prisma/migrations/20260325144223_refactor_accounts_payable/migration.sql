/*
  Warnings:

  - You are about to drop the column `dueDate` on the `accounts_payable` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `accounts_payable` table. All the data in the column will be lost.
  - You are about to drop the column `value_in_cents` on the `accounts_payable` table. All the data in the column will be lost.
  - Added the required column `total_value_in_cents` to the `accounts_payable` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `accounts_payable` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "accounts_payable_dueDate_idx";

-- DropIndex
DROP INDEX "accounts_payable_status_idx";

-- AlterTable
ALTER TABLE "accounts_payable" DROP COLUMN "dueDate",
DROP COLUMN "status",
DROP COLUMN "value_in_cents",
ADD COLUMN     "installments_count" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "payment_method" "PaymentMethod" NOT NULL DEFAULT 'BOLETO',
ADD COLUMN     "total_value_in_cents" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "account_installments" (
    "id" TEXT NOT NULL,
    "account_payable_id" TEXT NOT NULL,
    "installment_number" INTEGER NOT NULL,
    "value_in_cents" INTEGER NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'PENDENTE',
    "payment_date" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_installments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "account_installments_account_payable_id_idx" ON "account_installments"("account_payable_id");

-- CreateIndex
CREATE INDEX "account_installments_due_date_idx" ON "account_installments"("due_date");

-- CreateIndex
CREATE INDEX "account_installments_status_idx" ON "account_installments"("status");

-- AddForeignKey
ALTER TABLE "account_installments" ADD CONSTRAINT "account_installments_account_payable_id_fkey" FOREIGN KEY ("account_payable_id") REFERENCES "accounts_payable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
