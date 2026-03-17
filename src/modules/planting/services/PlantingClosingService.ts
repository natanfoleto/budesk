import prisma from "@/lib/prisma"

export class PlantingClosingService {
  /**
   * Block all records between startDate and endDate
   * Used for 'Fechamento Quinzenal'
   */
  static async closePeriod(seasonId: string, startDate: Date, endDate: Date, db = prisma) {
    return db.$transaction(async (tx) => {
      const countProductions = await tx.plantingProduction.updateMany({
        where: { seasonId, date: { gte: startDate, lte: endDate }, isClosed: false },
        data: { isClosed: true }
      })

      const countWages = await tx.dailyWage.updateMany({
        where: { seasonId, date: { gte: startDate, lte: endDate }, isClosed: false },
        data: { isClosed: true }
      })

      const countAllocations = await tx.driverAllocation.updateMany({
        where: { seasonId, date: { gte: startDate, lte: endDate }, isClosed: false },
        data: { isClosed: true }
      })

      const countExpenses = await tx.plantingExpense.updateMany({
        where: { seasonId, date: { gte: startDate, lte: endDate }, isClosed: false },
        data: { isClosed: true }
      })

      const countAreas = await tx.plantingArea.updateMany({
        where: { seasonId, date: { gte: startDate, lte: endDate }, isClosed: false },
        data: { isClosed: true }
      })

      const countAdvances = await tx.plantingAdvance.updateMany({
        where: { seasonId, date: { gte: startDate, lte: endDate }, isClosed: false },
        data: { isClosed: true }
      })

      return {
        productions: countProductions.count,
        wages: countWages.count,
        allocations: countAllocations.count,
        expenses: countExpenses.count,
        areas: countAreas.count,
        advances: countAdvances.count
      }
    })
  }

  /**
   * Reopen all records between startDate and endDate
   * Inverse of closePeriod — restricted to ROOT/ADMIN via API layer
   */
  static async reopenPeriod(seasonId: string, startDate: Date, endDate: Date, db = prisma) {
    return db.$transaction(async (tx) => {
      const countProductions = await tx.plantingProduction.updateMany({
        where: { seasonId, date: { gte: startDate, lte: endDate }, isClosed: true },
        data: { isClosed: false }
      })

      const countWages = await tx.dailyWage.updateMany({
        where: { seasonId, date: { gte: startDate, lte: endDate }, isClosed: true },
        data: { isClosed: false }
      })

      const countAllocations = await tx.driverAllocation.updateMany({
        where: { seasonId, date: { gte: startDate, lte: endDate }, isClosed: true },
        data: { isClosed: false }
      })

      const countExpenses = await tx.plantingExpense.updateMany({
        where: { seasonId, date: { gte: startDate, lte: endDate }, isClosed: true },
        data: { isClosed: false }
      })

      const countAreas = await tx.plantingArea.updateMany({
        where: { seasonId, date: { gte: startDate, lte: endDate }, isClosed: true },
        data: { isClosed: false }
      })

      const countAdvances = await tx.plantingAdvance.updateMany({
        where: { seasonId, date: { gte: startDate, lte: endDate }, isClosed: true },
        data: { isClosed: false }
      })

      return {
        productions: countProductions.count,
        wages: countWages.count,
        allocations: countAllocations.count,
        expenses: countExpenses.count,
        areas: countAreas.count,
        advances: countAdvances.count
      }
    })
  }
}
