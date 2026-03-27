-- AlterTable
ALTER TABLE "accounts_payable" ADD COLUMN     "attachment_url" TEXT,
ADD COLUMN     "category" "ExpenseCategory" NOT NULL DEFAULT 'OUTROS',
ADD COLUMN     "user_id" TEXT;

-- AlterTable
ALTER TABLE "financial_transactions" ADD COLUMN     "attachment_url" TEXT,
ADD COLUMN     "conciled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "user_id" TEXT;

-- CreateIndex
CREATE INDEX "accounts_payable_supplierId_idx" ON "accounts_payable"("supplierId");

-- CreateIndex
CREATE INDEX "financial_transactions_supplierId_idx" ON "financial_transactions"("supplierId");

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
