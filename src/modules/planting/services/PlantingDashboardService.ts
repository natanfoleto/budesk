import prisma from "@/lib/prisma"

export class PlantingDashboardService {
  /**
   * Return key metrics for the active season
   */
  static async getOverviewMetrics(seasonId: string, db = prisma) {
    const season = await db.plantingSeason.findUnique({ where: { id: seasonId } })
    if (!season) throw new Error("Safra não encontrada")

    const [
      productions,
      wages,
      allocations,
      expenses,
      areas
    ] = await Promise.all([
      db.plantingProduction.aggregate({
        where: { seasonId },
        _sum: { totalValueInCents: true, meters: true }
      }),
      db.dailyWage.aggregate({
        where: { seasonId },
        _sum: { valueInCents: true }
      }),
      db.driverAllocation.aggregate({
        where: { seasonId },
        _sum: { valueInCents: true }
      }),
      db.plantingExpense.aggregate({
        where: { seasonId },
        _sum: { totalValueInCents: true }
      }),
      db.plantingArea.aggregate({
        where: { seasonId },
        _sum: { hectares: true }
      })
    ])

    const totalCostInCents = 
      (productions._sum.totalValueInCents || 0) +
      (wages._sum.valueInCents || 0) +
      (allocations._sum.valueInCents || 0) +
      (expenses._sum.totalValueInCents || 0)

    const totalHectares = Number(areas._sum.hectares || 0)
    const costPerHectareInCents = totalHectares > 0 ? Math.round(totalCostInCents / totalHectares) : 0

    return {
      totalCostInCents,
      totalHectares,
      costPerHectareInCents,
      totalMeters: Number(productions._sum.meters || 0),
      breakdown: {
        productions: productions._sum.totalValueInCents || 0,
        wages: wages._sum.valueInCents || 0,
        allocations: allocations._sum.valueInCents || 0,
        expenses: expenses._sum.totalValueInCents || 0
      }
    }
  }
}
