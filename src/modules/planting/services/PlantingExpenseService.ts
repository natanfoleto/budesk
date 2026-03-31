import { ExpenseCategory, PaymentMethod, Prisma, TransactionType } from "@prisma/client"

import prisma from "@/lib/prisma"
import { FinanceService } from "@/src/modules/finance/services/FinanceService"

export class PlantingExpenseService {
  static async list(filters: { 
    seasonId?: string; 
    frontId?: string; 
    date?: Date;
    supplierId?: string;
    category?: string;
    vehicleId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }, db = prisma) {
    const where: Prisma.PlantingExpenseWhereInput = {}
    if (filters.seasonId) where.seasonId = filters.seasonId
    if (filters.frontId) where.frontId = filters.frontId
    
    // Filtro de data específica ou range
    if (filters.date) {
      where.date = filters.date
    } else if (filters.startDate || filters.endDate) {
      where.date = {
        gte: filters.startDate ? new Date(filters.startDate) : undefined,
        lte: filters.endDate ? new Date(filters.endDate) : undefined,
      }
    }

    if (filters.supplierId) where.supplierId = filters.supplierId
    if (filters.category) where.category = filters.category as ExpenseCategory
    if (filters.vehicleId) where.vehicleId = filters.vehicleId

    const page = filters.page || 1
    const limit = filters.limit || 10
    const skip = (page - 1) * limit

    const [total, data] = await Promise.all([
      db.plantingExpense.count({ where }),
      db.plantingExpense.findMany({
        where,
        orderBy: { date: "desc" },
        include: {
          front: { select: { id: true, name: true } },
          vehicle: { select: { id: true, plate: true, brand: true, model: true, color: true } },
          supplier: { select: { id: true, name: true } }
        },
        take: limit,
        skip,
      })
    ])

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
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
        paymentMethod: PaymentMethod.DINHEIRO, 
        supplierId: expense.supplierId,
        userId: userId,
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
            date: dt,
            supplierId: expense.supplierId
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
