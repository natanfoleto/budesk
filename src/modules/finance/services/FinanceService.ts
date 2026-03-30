import { ExpenseCategory, PaymentMethod, Prisma, PrismaClient, TransactionType } from "@prisma/client"

import prisma from "@/lib/prisma" // Fallback import, though we receive 'tx'

import { AuditService } from "../../audit/services/AuditService"

export type RegisterTransactionDTO = {
  type: TransactionType;
  category: ExpenseCategory;
  amountInCents: number;
  paymentMethod: PaymentMethod;
  description: string;
  date: Date;
  referenceId?: string | null;
  referenceType?: "employeeAdvance" | "maintenance" | "rhPayment" | "service" | "supplier" | "employee";
  costCenterId?: string | null;
  supplierId?: string | null;
  userId?: string | null;
};

export class FinanceService {
  /**
   * Centraliza a criação de registros financeiros (Movimentações de Caixa),
   * vinculando as tabelas secundárias com as foreign keys dinâmicas ou via relacionamentos inversos.
   */
  static async registerTransaction(
    tx: Prisma.TransactionClient | PrismaClient | undefined | null, 
    data: RegisterTransactionDTO
  ) {
    const db = tx || prisma
    
    const createData: Prisma.FinancialTransactionCreateInput = {
      type: data.type,
      category: data.category,
      valueInCents: data.amountInCents,
      description: data.description,
      date: data.date,
      paymentMethod: data.paymentMethod,
    }

    // Direct relations via connect
    if (data.costCenterId) createData.costCenter = { connect: { id: data.costCenterId } }
    if (data.supplierId) createData.supplier = { connect: { id: data.supplierId } }
    if (data.userId) createData.user = { connect: { id: data.userId } }

    // Specific reference relations
    if (data.referenceId && data.referenceType) {
      const ref = { connect: { id: data.referenceId } }
      if (data.referenceType === "employeeAdvance") createData.advance = ref
      if (data.referenceType === "maintenance") createData.maintenance = ref
      if (data.referenceType === "rhPayment") createData.rhPayment = ref
      if (data.referenceType === "service") createData.service = ref
      if (data.referenceType === "supplier") createData.supplier = ref
      if (data.referenceType === "employee") createData.employee = ref
    }

    const transaction = await db.financialTransaction.create({
      data: createData
    })

    if (data.userId) {
      await AuditService.logAction(
        db,
        "CREATE",
        "FinancialTransaction",
        transaction.id,
        transaction,
        data.userId
      )
    }

    return transaction
  }
}
