import { Prisma } from "@prisma/client"

import prisma from "@/lib/prisma"

export class PlantingProductionService {
  /**
   * Listar todos os apontamentos filtrados por safra, frente ou funcionário
   */
  static async list(filters: { seasonId?: string; frontId?: string; employeeId?: string; date?: Date }, db = prisma) {
    const where: Prisma.PlantingProductionWhereInput = {}
    if (filters.seasonId) where.seasonId = filters.seasonId
    if (filters.frontId) where.frontId = filters.frontId
    if (filters.employeeId) where.employeeId = filters.employeeId
    if (filters.date) where.date = filters.date

    return db.plantingProduction.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        employee: { select: { id: true, name: true } },
        front: { select: { id: true, name: true } }
      }
    })
  }

  static async getById(id: string, db = prisma) {
    return db.plantingProduction.findUnique({
      where: { id },
      include: {
        employee: true,
        front: true
      }
    })
  }

  /**
   * Criar um apontamento e calcular o valor total = metros * valor_metro
   */
  static async createOrUpdate(data: Prisma.PlantingProductionUncheckedCreateInput, db = prisma) {
    // Calcular total
    const meters = data.meters ? Number(data.meters) : 0
    const totalValueInCents = Math.round(meters * data.meterValueInCents)
    
    // Se existir id, faremos um update, se não, create
    if (data.id) {
      // Validar se não está fechado
      const existing = await db.plantingProduction.findUnique({ where: { id: data.id } })
      if (existing?.isClosed) throw new Error("Não é possível editar um apontamento em período fechado.")

      return db.plantingProduction.update({
        where: { id: data.id },
        data: {
          ...data,
          totalValueInCents
        }
      })
    }
    
    return db.plantingProduction.create({
      data: {
        ...data,
        totalValueInCents
      }
    })
  }

  static async delete(id: string, db = prisma) {
    const existing = await db.plantingProduction.findUnique({ where: { id } })
    if (existing?.isClosed) throw new Error("Não é possível excluir um apontamento em período fechado.")

    return db.plantingProduction.delete({ where: { id } })
  }
}
