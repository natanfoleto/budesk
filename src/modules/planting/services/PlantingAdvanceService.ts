import { Prisma } from "@prisma/client"

import prisma from "@/lib/prisma"

export class PlantingAdvanceService {
  static async list(filters: { seasonId?: string; frontId?: string; employeeId?: string; date?: Date }, db = prisma) {
    const where: Prisma.PlantingAdvanceWhereInput = {}
    if (filters.seasonId) where.seasonId = filters.seasonId
    if (filters.frontId) where.frontId = filters.frontId
    if (filters.employeeId) where.employeeId = filters.employeeId
    if (filters.date) where.date = filters.date

    return db.plantingAdvance.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        employee: { select: { id: true, name: true } },
        front: { select: { id: true, name: true } }
      }
    })
  }

  static async createOrUpdate(data: Prisma.PlantingAdvanceUncheckedCreateInput, db = prisma) {
    // Ensure the date is a Date object if it's coming as a string from the API
    if (data.date && typeof data.date === "string") {
      data.date = new Date(data.date)
    }

    if (data.id) {
      const existing = await db.plantingAdvance.findUnique({ where: { id: data.id } })
      if (existing?.isClosed) throw new Error("Não é possível editar um adiantamento de um período fechado.")

      return db.plantingAdvance.update({
        where: { id: data.id },
        data
      })
    }
    
    return db.plantingAdvance.create({ data })
  }

  static async delete(id: string, db = prisma) {
    const existing = await db.plantingAdvance.findUnique({ where: { id } })
    if (existing?.isClosed) throw new Error("Não é possível excluir um adiantamento de período fechado.")

    return db.plantingAdvance.delete({ where: { id } })
  }
}
