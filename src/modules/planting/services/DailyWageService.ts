import { Prisma } from "@prisma/client"

import prisma from "@/lib/prisma"

export class DailyWageService {
  static async list(filters: { seasonId?: string; frontId?: string; employeeId?: string; date?: Date }, db = prisma) {
    const where: Prisma.DailyWageWhereInput = {}
    if (filters.seasonId) where.seasonId = filters.seasonId
    if (filters.frontId) where.frontId = filters.frontId
    if (filters.employeeId) where.employeeId = filters.employeeId
    if (filters.date) where.date = filters.date

    return db.dailyWage.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        employee: { select: { id: true, name: true } },
        front: { select: { id: true, name: true } }
      }
    })
  }

  static async createOrUpdate(data: Prisma.DailyWageUncheckedCreateInput, db = prisma) {
    if (data.id) {
      const existing = await db.dailyWage.findUnique({ where: { id: data.id } })
      if (existing?.isClosed) throw new Error("Não é possível editar uma diária de um período fechado.")

      return db.dailyWage.update({
        where: { id: data.id },
        data
      })
    }
    
    return db.dailyWage.create({ data })
  }

  static async delete(id: string, db = prisma) {
    const existing = await db.dailyWage.findUnique({ where: { id } })
    if (existing?.isClosed) throw new Error("Não é possível excluir uma diária de período fechado.")

    return db.dailyWage.delete({ where: { id } })
  }
}
