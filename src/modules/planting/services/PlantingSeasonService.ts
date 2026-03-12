import { Prisma } from "@prisma/client"

import prisma from "@/lib/prisma"
import { AuditService } from "@/src/modules/audit/services/AuditService"

export class PlantingSeasonService {
  static async list(db = prisma) {
    return db.plantingSeason.findMany({
      orderBy: { startDate: "desc" },
      include: {
        _count: {
          select: { workFronts: true, plantingProductions: true }
        }
      }
    })
  }

  static async getById(id: string, db = prisma) {
    return db.plantingSeason.findUnique({
      where: { id },
      include: { workFronts: true }
    })
  }

  static async create(data: Prisma.PlantingSeasonCreateInput, userId?: string, db = prisma) {
    const season = await db.plantingSeason.create({ data })
    if (userId) {
      await AuditService.logAction(db, "CREATE", "PlantingSeason", season.id, season, userId)
    }
    return season
  }

  static async update(id: string, data: Prisma.PlantingSeasonUpdateInput, userId?: string, db = prisma) {
    const oldData = await db.plantingSeason.findUnique({ where: { id } })
    const season = await db.plantingSeason.update({ where: { id }, data })
    if (userId && oldData) {
      // oldData cast to Prisma.InputJsonValue implicitly via object literal
      await AuditService.logAction(db, "UPDATE", "PlantingSeason", season.id, season as Prisma.InputJsonValue, userId, oldData as Prisma.InputJsonValue)
    }
    return season
  }

  static async getActiveSeason(db = prisma) {
    return db.plantingSeason.findFirst({
      where: { active: true },
      orderBy: { startDate: "desc" }
    })
  }
}
