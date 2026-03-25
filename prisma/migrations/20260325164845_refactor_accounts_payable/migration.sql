/*
  Warnings:

  - A unique constraint covering the columns `[transaction_id]` on the table `account_installments` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "account_installments" ADD COLUMN     "transaction_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "account_installments_transaction_id_key" ON "account_installments"("transaction_id");

-- AddForeignKey
ALTER TABLE "account_installments" ADD CONSTRAINT "account_installments_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "financial_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
