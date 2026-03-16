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
    
    const relationMap: Record<string, { connect: { id: string } }> = {}
    if (data.referenceId && data.referenceType) {
      if (data.referenceType === "employeeAdvance") relationMap.advance = { connect: { id: data.referenceId } }
      if (data.referenceType === "maintenance") relationMap.maintenance = { connect: { id: data.referenceId } }
      if (data.referenceType === "rhPayment") relationMap.rhPayment = { connect: { id: data.referenceId } }
      if (data.referenceType === "service") relationMap.service = { connect: { id: data.referenceId } }
      if (data.referenceType === "supplier") relationMap.supplier = { connect: { id: data.referenceId } }
      if (data.referenceType === "employee") relationMap.employee = { connect: { id: data.referenceId } }
    }

    const transaction = await db.financialTransaction.create({
      data: {
        type: data.type,
        category: data.category,
        valueInCents: data.amountInCents,
        description: data.description,
        date: data.date,
        paymentMethod: data.paymentMethod,
        costCenterId: data.costCenterId || null,
        supplierId: data.supplierId || null,
        ...relationMap
      }
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
