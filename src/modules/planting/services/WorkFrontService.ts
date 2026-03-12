import { Prisma } from "@prisma/client"

import prisma from "@/lib/prisma"
import { AuditService } from "@/src/modules/audit/services/AuditService"

export class WorkFrontService {
  static async list(seasonId?: string, db = prisma) {
    return db.workFront.findMany({
      where: seasonId ? { seasonId } : undefined,
      orderBy: { name: "asc" },
      include: {
        season: { select: { name: true } },
        _count: {
          select: { plantingProductions: true }
        }
      }
    })
  }
  
  static async getActiveFronts(seasonId: string, db = prisma) {
    return db.workFront.findMany({
      where: { seasonId, active: true },
      orderBy: { name: "asc" }
    })
  }

  static async getById(id: string, db = prisma) {
    return db.workFront.findUnique({
      where: { id }
    })
  }

  static async create(data: Prisma.WorkFrontUncheckedCreateInput, userId?: string, db = prisma) {
    const front = await db.workFront.create({ data })
    if (userId) {
      await AuditService.logAction(db, "CREATE", "WorkFront", front.id, front, userId)
    }
    return front
  }

  static async update(id: string, data: Prisma.WorkFrontUpdateInput, userId?: string, db = prisma) {
    const oldData = await db.workFront.findUnique({ where: { id } })
    const front = await db.workFront.update({ where: { id }, data })
    if (userId && oldData) {
      await AuditService.logAction(db, "UPDATE", "WorkFront", front.id, front as Prisma.InputJsonValue, userId, oldData as Prisma.InputJsonValue)
    }
    return front
  }
}
