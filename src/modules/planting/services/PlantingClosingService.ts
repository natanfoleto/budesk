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
  
  /**
   * Check if both fortnights of a month are closed for a given season
   */
  static async checkMonthClosed(seasonId: string, year: number, month: number, db = prisma) {
    // 1st Fortnight: 01 to 15
    const start1 = new Date(year, month, 1, 0, 0, 0, 0)
    const end1 = new Date(year, month, 15, 23, 59, 59, 999)

    // 2nd Fortnight: 16 to end
    const start2 = new Date(year, month, 16, 0, 0, 0, 0)
    const end2 = new Date(year, month + 1, 0, 23, 59, 59, 999)

    // A fortnight is considered closed if there is at least one closed record 
    // and no open records, OR if we follow the current convention: 
    // at least one record exists and it's closed.
    // Actually, the current convention in GET /api/planting/closing is just findFirst isClosed: true.
    
    const [closed1, closed2] = await Promise.all([
      db.plantingProduction.findFirst({
        where: { seasonId, date: { gte: start1, lte: end1 }, isClosed: true },
        select: { id: true }
      }),
      db.plantingProduction.findFirst({
        where: { seasonId, date: { gte: start2, lte: end2 }, isClosed: true },
        select: { id: true }
      })
    ])

    return !!closed1 && !!closed2
  }
}
