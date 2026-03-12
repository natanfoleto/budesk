import { Prisma } from "@prisma/client"

import prisma from "@/lib/prisma"

export class DriverAllocationService {
  static async listCategories(db = prisma) {
    return db.driverCategory.findMany({
      orderBy: { name: "asc" }
    })
  }
  
  static async createCategory(data: Prisma.DriverCategoryCreateInput, db = prisma) {
    return db.driverCategory.create({ data })
  }
  
  static async updateCategory(id: string, data: Prisma.DriverCategoryUpdateInput, db = prisma) {
    return db.driverCategory.update({ where: { id }, data })
  }

  static async list(filters: { seasonId?: string; frontId?: string; employeeId?: string; date?: Date }, db = prisma) {
    const where: Prisma.DriverAllocationWhereInput = {}
    if (filters.seasonId) where.seasonId = filters.seasonId
    if (filters.frontId) where.frontId = filters.frontId
    if (filters.employeeId) where.employeeId = filters.employeeId
    if (filters.date) where.date = filters.date

    return db.driverAllocation.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        employee: { select: { id: true, name: true } },
        front: { select: { id: true, name: true } },
        category: true
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
    
    // Check if category exists to grab default value if not passed
    if (!data.valueInCents && data.categoryId) {
      const cat = await db.driverCategory.findUnique({ where: { id: data.categoryId } })
      if (cat) {
        data.valueInCents = cat.defaultDailyValueInCents
      }
    }

    return db.driverAllocation.create({ data })
  }

  static async delete(id: string, db = prisma) {
    const existing = await db.driverAllocation.findUnique({ where: { id } })
    if (existing?.isClosed) throw new Error("Não é possível excluir alocação em período fechado.")

    return db.driverAllocation.delete({ where: { id } })
  }
}
