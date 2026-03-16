import { PaymentMethod,Prisma, TransactionType } from "@prisma/client"

import prisma from "@/lib/prisma"
import { FinanceService } from "@/src/modules/finance/services/FinanceService"

export class PlantingExpenseService {
  static async list(filters: { seasonId?: string; frontId?: string; date?: Date }, db = prisma) {
    const where: Prisma.PlantingExpenseWhereInput = {}
    if (filters.seasonId) where.seasonId = filters.seasonId
    if (filters.frontId) where.frontId = filters.frontId
    if (filters.date) where.date = filters.date

    return db.plantingExpense.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        front: { select: { id: true, name: true } },
        vehicle: { select: { id: true, plate: true, brand: true, model: true } }
      }
    })
  }

  static async create(data: Prisma.PlantingExpenseUncheckedCreateInput, userId?: string, db = prisma) {
    // Calcular total se o usuário não enviou (quantidade * unit)
    let total = data.totalValueInCents
    if (!total && data.quantity && data.unitValueInCents) {
      total = Math.round(Number(data.quantity) * data.unitValueInCents)
    }

    // Wrap in transaction
    return db.$transaction(async (tx) => {
      const expense = await tx.plantingExpense.create({
        data: {
          ...data,
          totalValueInCents: total || 0
        }
      })

      // Generate financial transaction automatically
      const transaction = await FinanceService.registerTransaction(tx, {
        type: TransactionType.SAIDA,
        category: expense.category,
        amountInCents: expense.totalValueInCents,
        description: expense.description,
        date: new Date(expense.date),
        paymentMethod: PaymentMethod.DINHEIRO, // Padrão, pode ser editado pelo financeiro dps
        referenceType: "service", // We could add plantingExpense to referenceType in DTO soon, using 'service' for now or avoiding reference if not mapped
        // However, relation logic requires we update schema of DTO if needed.
        // Let's rely on Prisma connect directly for plantingExpenseId
      })

      // Link them together
      await tx.plantingExpense.update({
        where: { id: expense.id },
        data: { transactionId: transaction.id }
      })

      return expense
    })
  }

  static async update(
    id: string,
    data: Prisma.PlantingExpenseUncheckedUpdateInput,
    userId?: string,
    db = prisma
  ) {
    const existing = await db.plantingExpense.findUnique({
      where: { id },
      include: { transaction: true }
    })
    
    if (!existing) throw new Error("Gasto não encontrado")
    if (existing.isClosed) throw new Error("Não é possível editar gasto em período fechado.")

    let total = Number(data.totalValueInCents ?? existing.totalValueInCents)
    if (data.quantity !== undefined && data.unitValueInCents !== undefined && !data.totalValueInCents) {
      total = Math.round(Number(data.quantity) * Number(data.unitValueInCents))
    }

    return db.$transaction(async (tx) => {
      const expense = await tx.plantingExpense.update({
        where: { id },
        data: {
          ...data,
          totalValueInCents: total
        }
      })

      if (existing.transactionId) {
        const amount = expense.totalValueInCents
        const category = expense.category
        const desc = expense.description
        const dt = new Date(expense.date)

        await tx.financialTransaction.update({
          where: { id: existing.transactionId },
          data: {
            valueInCents: amount,
            category: category,
            description: desc,
            date: dt
          }
        })
      }

      return expense
    })
  }

  static async delete(id: string, db = prisma) {
    const existing = await db.plantingExpense.findUnique({ where: { id }, include: { transaction: true } })
    if (existing?.isClosed) throw new Error("Não é possível excluir gasto em período fechado.")

    return db.$transaction(async (tx) => {
      if (existing?.transactionId) {
        await tx.financialTransaction.delete({ where: { id: existing.transactionId } })
      }
      return tx.plantingExpense.delete({ where: { id } })
    })
  }
}
