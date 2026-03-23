import { Prisma } from "@prisma/client"

import prisma from "@/lib/prisma"

export class DailyWageService {
  static async list(filters: { seasonId?: string; frontId?: string; employeeId?: string; date?: Date; tagIds?: string[] }, db = prisma) {
    const where: Prisma.DailyWageWhereInput = {}
    if (filters.seasonId) where.seasonId = filters.seasonId
    if (filters.frontId) where.frontId = filters.frontId
    if (filters.employeeId) where.employeeId = filters.employeeId
    if (filters.date) where.date = filters.date
    if (filters.tagIds && filters.tagIds.length > 0) {
      where.employee = {
        tags: { some: { tagId: { in: filters.tagIds } } }
      }
    }

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
    // Validate termination date
    if (data.employeeId && data.date) {
      const employee = await db.employee.findUnique({
        where: { id: data.employeeId },
        include: {
          employmentRecords: {
            orderBy: { admissionDate: 'desc' },
            take: 1,
          },
        },
      })

      const terminationDate = employee?.employmentRecords[0]?.terminationDate
      if (terminationDate) {
        const recordDate = new Date(data.date as string | number | Date)
        const termDate = new Date(terminationDate as string | number | Date)
        
        // Reset times for comparison (UTC to be consistent)
        recordDate.setUTCHours(0, 0, 0, 0)
        termDate.setUTCHours(0, 0, 0, 0)

        if (recordDate > termDate) {
          const formattedTermDate = termDate.getUTCDate().toString().padStart(2, '0') + '/' + 
                                  (termDate.getUTCMonth() + 1).toString().padStart(2, '0') + '/' + 
                                  termDate.getUTCFullYear()
          throw new Error(`Não é possível registrar diárias/presenças para este funcionário após a data de encerramento (${formattedTermDate}).`)
        }
      }
    }

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
