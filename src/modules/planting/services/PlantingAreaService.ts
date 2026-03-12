import { Prisma } from "@prisma/client"

import prisma from "@/lib/prisma"

export class PlantingAreaService {
  static async list(filters: { seasonId?: string; frontId?: string; date?: Date }, db = prisma) {
    const where: Prisma.PlantingAreaWhereInput = {}
    if (filters.seasonId) where.seasonId = filters.seasonId
    if (filters.frontId) where.frontId = filters.frontId
    if (filters.date) where.date = filters.date

    return db.plantingArea.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        front: { select: { id: true, name: true } }
      }
    })
  }

  static async createOrUpdate(data: Prisma.PlantingAreaUncheckedCreateInput, db = prisma) {
    if (data.id) {
      const existing = await db.plantingArea.findUnique({ where: { id: data.id } })
      if (existing?.isClosed) throw new Error("Não é possível editar área de período fechado.")

      return db.plantingArea.update({
        where: { id: data.id },
        data
      })
    }
    
    return db.plantingArea.create({ data })
  }

  static async delete(id: string, db = prisma) {
    const existing = await db.plantingArea.findUnique({ where: { id } })
    if (existing?.isClosed) throw new Error("Não é possível excluir área em período fechado.")

    return db.plantingArea.delete({ where: { id } })
  }
}
