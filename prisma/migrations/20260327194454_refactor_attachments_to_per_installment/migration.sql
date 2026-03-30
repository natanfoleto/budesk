-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('BOLETO', 'COMPROVANTE', 'NOTA_FISCAL', 'CONTRATO', 'OUTROS');

-- CreateTable
CREATE TABLE "account_installment_attachments" (
    "id" TEXT NOT NULL,
    "installment_id" TEXT NOT NULL,
    "type" "AttachmentType" NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_installment_attachments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "account_installment_attachments" ADD CONSTRAINT "account_installment_attachments_installment_id_fkey" FOREIGN KEY ("installment_id") REFERENCES "account_installments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
