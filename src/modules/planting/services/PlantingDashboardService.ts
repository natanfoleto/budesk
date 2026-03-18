import { endOfMonth, format, startOfMonth, subDays } from "date-fns"

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
        planting: productionsPlanting._sum.totalValueInCents || 0,
        cutting: productionsCutting._sum.totalValueInCents || 0,
        wages: wages._sum.valueInCents || 0,
        allocations: allocations._sum.valueInCents || 0,
        expenses: expenses._sum.totalValueInCents || 0,
        advances: 0 // Advances aren't typically "costs" but "pre-payments", included if requested
      }
    }
  }

  /**
   * Returns metrics for Today, Fortnight, Month, and Overall in one go
   */
  static async getPeriodMetrics(seasonId: string, baseDate: string = format(new Date(), "yyyy-MM-dd")) {
    const d = new Date(baseDate + "T12:00:00")
    const day = d.getDate()
    
    // Fortnight
    const fnStart = day <= 15 ? startOfMonth(d) : new Date(d.getFullYear(), d.getMonth(), 16, 12)
    const fnEnd = day <= 15 ? new Date(d.getFullYear(), d.getMonth(), 15, 12) : endOfMonth(d)

    const [today, fortnight, month, general] = await Promise.all([
      this.getOverviewMetrics(seasonId, baseDate, baseDate),
      this.getOverviewMetrics(seasonId, format(fnStart, "yyyy-MM-dd"), format(fnEnd, "yyyy-MM-dd")),
      this.getOverviewMetrics(seasonId, format(startOfMonth(d), "yyyy-MM-dd"), format(endOfMonth(d), "yyyy-MM-dd")),
      this.getOverviewMetrics(seasonId)
    ])

    return { today, fortnight, month, general }
  }

  /**
   * Returns aggregates for the last 30 days for charts
   */
  static async getChartData(seasonId: string, days = 30) {
    const end = new Date()
    const start = subDays(end, days - 1)
    
    // Fetch all records for the period once to avoid N+1
    const [productions, wages, drivers, expenses] = await Promise.all([
      prisma.plantingProduction.findMany({
        where: { seasonId, date: { gte: start, lte: end } },
        select: { date: true, totalValueInCents: true, meters: true, type: true }
      }),
      prisma.dailyWage.findMany({
        where: { seasonId, date: { gte: start, lte: end } },
        select: { date: true, valueInCents: true }
      }),
      prisma.driverAllocation.findMany({
        where: { seasonId, date: { gte: start, lte: end } },
        select: { date: true, valueInCents: true }
      }),
      prisma.plantingExpense.findMany({
        where: { seasonId, date: { gte: start, lte: end } },
        select: { date: true, totalValueInCents: true }
      })
    ])

    const chartMap = new Map<string, {
      date: string
      cost: number
      meters: number
      planting: number
      cutting: number
      wages: number
      drivers: number
      expenses: number
    }>()
    
    // Initialize days
    for (let i = 0; i < days; i++) {
      const dateStr = format(subDays(end, i), "yyyy-MM-dd")
      chartMap.set(dateStr, {
        date: dateStr,
        cost: 0,
        meters: 0,
        planting: 0,
        cutting: 0,
        wages: 0,
        drivers: 0,
        expenses: 0
      })
    }

    // Aggregate
    productions.forEach(p => {
      const dateStr = p.date.toISOString().split('T')[0]
      const day = chartMap.get(dateStr)
      if (day) {
        day.cost += p.totalValueInCents
        day.meters += Number(p.meters || 0)
        if (p.type === 'PLANTIO') day.planting += Number(p.meters || 0)
        else day.cutting += Number(p.meters || 0)
      }
    })

    wages.forEach(w => {
      const dateStr = w.date.toISOString().split('T')[0]
      const day = chartMap.get(dateStr)
      if (day) {
        day.cost += w.valueInCents
        day.wages += w.valueInCents
      }
    })

    drivers.forEach(d => {
      const dateStr = d.date.toISOString().split('T')[0]
      const day = chartMap.get(dateStr)
      if (day) {
        day.cost += d.valueInCents
        day.drivers += d.valueInCents
      }
    })

    expenses.forEach(e => {
      const dateStr = e.date.toISOString().split('T')[0]
      const day = chartMap.get(dateStr)
      if (day) {
        day.cost += e.totalValueInCents
        day.expenses += e.totalValueInCents
      }
    })

    return Array.from(chartMap.values()).sort((a, b) => a.date.localeCompare(b.date))
  }
}
