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
    let meterValueInCents = data.meterValueInCents || 0

    // Fallback for default price if not provided
    if (meterValueInCents === 0) {
      const paramKey = data.type === "PLANTIO" ? "valor_metro_plantio" : "valor_metro_corte"
      const param = await db.plantingParameter.findUnique({ where: { key: paramKey } })
      if (param && !isNaN(Number(param.value))) {
        meterValueInCents = Number(param.value)
      }
    }

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
        
        // Reset times for comparison (UTC to be consistent with database and frontend logic)
        recordDate.setUTCHours(0, 0, 0, 0)
        termDate.setUTCHours(0, 0, 0, 0)

        if (recordDate > termDate) {
          const formattedTermDate = termDate.getUTCDate().toString().padStart(2, '0') + '/' + 
                                  (termDate.getUTCMonth() + 1).toString().padStart(2, '0') + '/' + 
                                  termDate.getUTCFullYear()
          throw new Error(`Não é possível registrar apontamentos para este funcionário após a data de encerramento (${formattedTermDate}).`)
        }
      }
    }

    // Calcular total
    const meters = data.meters ? Number(data.meters) : 0
    const totalValueInCents = Math.round(meters * meterValueInCents)
    
    // Se existir id, faremos um update, se não, create
    if (data.id) {
      // Validar se não está fechado
      const existing = await db.plantingProduction.findUnique({ where: { id: data.id } })
      if (existing?.isClosed) throw new Error("Não é possível editar um apontamento em período fechado.")

      return db.plantingProduction.update({
        where: { id: data.id },
        data: {
          ...data,
          meterValueInCents,
          totalValueInCents
        }
      })
    }

    // For new records, check if the date falls within a closed period
    if (data.date && data.seasonId) {
      const recordDate = new Date(data.date)
      // Build the fortnight boundaries for this record's date (in UTC)
      const day = recordDate.getUTCDate()
      const year = recordDate.getUTCFullYear()
      const month = recordDate.getUTCMonth() // 0-based
      const fortnightStart = day <= 15
        ? new Date(Date.UTC(year, month, 1, 0, 0, 0, 0))
        : new Date(Date.UTC(year, month, 16, 0, 0, 0, 0))
      const fortnightEnd = day <= 15
        ? new Date(Date.UTC(year, month, 15, 23, 59, 59, 999))
        : new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999)) // last day of month

      const closedInPeriod = await db.plantingProduction.findFirst({
        where: {
          seasonId: data.seasonId as string,
          date: { gte: fortnightStart, lte: fortnightEnd },
          isClosed: true,
        }
      })
      if (closedInPeriod) throw new Error("Não é possível criar apontamentos em um período que já foi fechado.")
    }

    return db.plantingProduction.create({
      data: {
        ...data,
        meterValueInCents,
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
