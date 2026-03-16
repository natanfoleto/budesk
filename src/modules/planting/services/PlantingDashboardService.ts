import prisma from "@/lib/prisma"

export class PlantingDashboardService {
  /**
   * Return key metrics for the active season, optionally filtered by date range
   */
  static async getOverviewMetrics(seasonId: string, startDate?: string, endDate?: string, db = prisma) {
    const season = await db.plantingSeason.findUnique({ where: { id: seasonId } })
    if (!season) throw new Error("Safra não encontrada")

    const dateFilter = startDate && endDate ? {
      gte: new Date(`${startDate}T00:00:00Z`),
      lte: new Date(`${endDate}T23:59:59Z`)
    } : undefined

    const [
      productionsPlanting,
      productionsCutting,
      wages,
      allocations,
      expenses,
      areas
    ] = await Promise.all([
      db.plantingProduction.aggregate({
        where: { seasonId, type: 'PLANTIO', date: dateFilter },
        _sum: { totalValueInCents: true, meters: true }
      }),
      db.plantingProduction.aggregate({
        where: { seasonId, type: 'CORTE', date: dateFilter },
        _sum: { totalValueInCents: true, meters: true }
      }),
      db.dailyWage.aggregate({
        where: { seasonId, date: dateFilter },
        _sum: { valueInCents: true }
      }),
      db.driverAllocation.aggregate({
        where: { seasonId, date: dateFilter },
        _sum: { valueInCents: true }
      }),
      db.plantingExpense.aggregate({
        where: { seasonId, date: dateFilter },
        _sum: { totalValueInCents: true }
      }),
      db.plantingArea.aggregate({
        where: { seasonId, date: dateFilter },
        _sum: { hectares: true }
      })
    ])

    const totalCostInCents = 
      (productionsPlanting._sum.totalValueInCents || 0) +
      (productionsCutting._sum.totalValueInCents || 0) +
      (wages._sum.valueInCents || 0) +
      (allocations._sum.valueInCents || 0) +
      (expenses._sum.totalValueInCents || 0)

    const totalHectares = Number(areas._sum.hectares || 0)
    const costPerHectareInCents = totalHectares > 0 ? Math.round(totalCostInCents / totalHectares) : 0

    const totalPlantingMeters = Number(productionsPlanting._sum.meters || 0)
    const totalCuttingMeters = Number(productionsCutting._sum.meters || 0)

    return {
      totalCostInCents,
      totalHectares,
      costPerHectareInCents,
      totalMeters: totalPlantingMeters + totalCuttingMeters,
      totalPlantingMeters,
      totalCuttingMeters,
      breakdown: {
        productions: (productionsPlanting._sum.totalValueInCents || 0) + (productionsCutting._sum.totalValueInCents || 0),
        wages: wages._sum.valueInCents || 0,
        allocations: allocations._sum.valueInCents || 0,
        expenses: expenses._sum.totalValueInCents || 0
      }
    }
  }
}
