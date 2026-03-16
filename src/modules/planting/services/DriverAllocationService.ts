import { Prisma } from "@prisma/client"

import prisma from "@/lib/prisma"

export class DriverAllocationService {
  static async list(filters: { seasonId?: string; frontId?: string; employeeId?: string; date?: Date; vehicleId?: string }, db = prisma) {
    const where: Prisma.DriverAllocationWhereInput = {}
    if (filters.seasonId) where.seasonId = filters.seasonId
    if (filters.frontId) where.frontId = filters.frontId
    if (filters.employeeId) where.employeeId = filters.employeeId
    if (filters.date) where.date = filters.date
    if (filters.vehicleId) where.vehicleId = filters.vehicleId

    return db.driverAllocation.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        employee: { select: { id: true, name: true } },
        front: { select: { id: true, name: true } },
        vehicle: { select: { id: true, plate: true, model: true } }
      }
    })
  }

  static async createOrUpdate(data: Prisma.DriverAllocationUncheckedCreateInput, db = prisma) {
    if (data.id) {
      const existing = await db.driverAllocation.findUnique({ where: { id: data.id } })
      if (existing?.isClosed) throw new Error("Não é possível editar alocação em período fechado.")

      return db.driverAllocation.update({
        where: { id: data.id },
        data
      })
    }
    
    return db.driverAllocation.create({ data })
  }

  static async delete(id: string, db = prisma) {
    const existing = await db.driverAllocation.findUnique({ where: { id } })
    if (existing?.isClosed) throw new Error("Não é possível excluir alocação em período fechado.")

    return db.driverAllocation.delete({ where: { id } })
  }
}
