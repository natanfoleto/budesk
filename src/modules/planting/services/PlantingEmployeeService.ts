import { 
  AttendanceType, 
  DailyWage,
  DriverAllocation,
  EmployeeAccount,
  PlantingAdvance,
  PlantingProduction,
  PlantingProductionType} from "@prisma/client"

import prisma from "@/lib/prisma"
 
function toLocalDateStr(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export interface EmployeeSummary {
  employee: {
    id: string
    name: string
    accounts: EmployeeAccount[]
  }
  seasonName: string
  totals: {
    earnedInCents: number
    daysWorked: number
    absences: number
    advancesInCents: number
    plantingMeters: number
    cuttingMeters: number
  }
  averages: {
    dailyGainInCents: number
    dailyPlantingMeters: number
    dailyCuttingMeters: number
  }
  details: {
    productions: PlantingProduction[]
    wages: DailyWage[]
    drivers: DriverAllocation[]
    advances: (PlantingAdvance & { account: EmployeeAccount | null })[]
    presence: { date: string; status: string }[]
  }
  insights: {
    gainEvolution: { date: string; valueInCents: number }[]
    productivityEvolution: { date: string; planting: number; cutting: number }[]
    mostProductiveDay?: { date: string; meters: number }
    averageGainComparison?: string
  }
}

export class PlantingEmployeeService {
  static async getSummary(
    employeeId: string,
    seasonId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<EmployeeSummary> {
    const dateFilter = startDate && endDate ? {
      gte: startDate,
      lte: endDate
    } : undefined

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        accounts: { orderBy: { isDefault: "desc" } }
      }
    })

    if (!employee) throw new Error("Funcionário não encontrado")

    const season = await prisma.plantingSeason.findUnique({
      where: { id: seasonId },
      select: { name: true }
    })

    const [productions, dailyWages, drivers, advances] = await Promise.all([
      prisma.plantingProduction.findMany({
        where: { employeeId, seasonId, date: dateFilter },
        orderBy: { date: "asc" }
      }),
      prisma.dailyWage.findMany({
        where: { employeeId, seasonId, date: dateFilter },
        orderBy: { date: "asc" }
      }),
      prisma.driverAllocation.findMany({
        where: { employeeId, seasonId, date: dateFilter },
        orderBy: { date: "asc" }
      }),
      prisma.plantingAdvance.findMany({
        where: { employeeId, seasonId, date: dateFilter },
        include: { account: true },
        orderBy: { date: "asc" }
      })
    ])

    // Calculate totals
    let totalEarnedInCents = 0
    let totalPlantingMeters = 0
    let totalCuttingMeters = 0
    const workedDates = new Set<string>()
    let totalAbsences = 0

    productions.forEach(p => {
      if (p.presence === "PRESENCA") {
        totalEarnedInCents += p.totalValueInCents
        workedDates.add(toLocalDateStr(p.date))
        if (p.type === (PlantingProductionType.PLANTIO as string)) totalPlantingMeters += Number(p.meters || 0)
        else totalCuttingMeters += Number(p.meters || 0)
      }
    })

    dailyWages.forEach(w => {
      totalEarnedInCents += w.valueInCents
      // Only count as worked if it's PRESENCA (NOT FOLGA)
      if (w.presence === (AttendanceType.PRESENCA as string)) {
        workedDates.add(toLocalDateStr(w.date))
      }
    })

    drivers.forEach(d => {
      totalEarnedInCents += d.valueInCents
      workedDates.add(toLocalDateStr(d.date))
    })

    const totalAdvancesInCents = advances.reduce((acc, curr) => acc + curr.valueInCents, 0)

    // Detailed presence calculation
    const allDatesSet = new Set<string>()
    productions.forEach(p => allDatesSet.add(toLocalDateStr(p.date)))
    dailyWages.forEach(w => allDatesSet.add(toLocalDateStr(w.date)))
    drivers.forEach(d => allDatesSet.add(toLocalDateStr(d.date)))

    const sortedDates = Array.from(allDatesSet).sort()
    const presenceDetails: { date: string; status: string }[] = []

    sortedDates.forEach(dateStr => {
      const dayProds = productions.filter(p => toLocalDateStr(p.date) === dateStr)
      const dayWages = dailyWages.filter(w => toLocalDateStr(w.date) === dateStr)
      const isDriver = drivers.some(d => toLocalDateStr(d.date) === dateStr)

      // Priority for status: DRIVER > PRESENCA > FOLGA > OTHER ABSENCES
      if (isDriver) {
        presenceDetails.push({ date: dateStr, status: "PRESENCA" })
      } else {
        const prodPresence = dayProds.find(p => p.presence === (AttendanceType.PRESENCA as string))
        const wagePresence = dayWages.find(w => w.presence === (AttendanceType.PRESENCA as string))
        
        if (prodPresence || wagePresence) {
          presenceDetails.push({ date: dateStr, status: "PRESENCA" })
        } else {
          // Check for FOLGA next
          const folga = dayWages.find(w => w.presence === (AttendanceType.FOLGA as string))
          if (folga) {
            presenceDetails.push({ date: dateStr, status: "FOLGA" })
          } else {
            // Find any other status or default to FALTA
            const otherStatus = dayWages.find(w => w.presence !== "PRESENCA")?.presence ||
                               dayProds.find(p => p.presence !== "PRESENCA")?.presence ||
                               "FALTA"
            presenceDetails.push({ date: dateStr, status: otherStatus })
            if (otherStatus !== "FOLGA") {
              totalAbsences++
            }
          }
        }
      }
    })

    const daysWorkedCount = workedDates.size

    // Evolution Data for Insights
    const gainEvolution: { date: string; valueInCents: number }[] = []
    const productivityEvolution: { date: string; planting: number; cutting: number }[] = []

    sortedDates.forEach(dateStr => {
      let dayGain = 0
      let dayPlanting = 0
      let dayCutting = 0

      productions.filter(p => toLocalDateStr(p.date) === dateStr && p.presence === (AttendanceType.PRESENCA as string)).forEach(p => {
        dayGain += p.totalValueInCents
        if (p.type === (PlantingProductionType.PLANTIO as string)) dayPlanting += Number(p.meters || 0)
        else dayCutting += Number(p.meters || 0)
      })
      dailyWages.filter(w => toLocalDateStr(w.date) === dateStr && (w.presence === (AttendanceType.PRESENCA as string) || w.presence === (AttendanceType.FOLGA as string))).forEach(w => {
        dayGain += w.valueInCents
      })
      drivers.filter(d => toLocalDateStr(d.date) === dateStr).forEach(d => {
        dayGain += d.valueInCents
      })

      gainEvolution.push({ date: dateStr, valueInCents: dayGain })
      productivityEvolution.push({ date: dateStr, planting: dayPlanting, cutting: dayCutting })
    })

    const mostProductiveDay = productivityEvolution.length > 0 
      ? [...productivityEvolution].sort((a, b) => (b.planting + b.cutting) - (a.planting + a.cutting))[0]
      : undefined

    return {
      employee: {
        id: employee.id,
        name: employee.name,
        accounts: employee.accounts
      },
      seasonName: season?.name || seasonId,
      totals: {
        earnedInCents: totalEarnedInCents,
        daysWorked: daysWorkedCount,
        absences: totalAbsences,
        advancesInCents: totalAdvancesInCents,
        plantingMeters: totalPlantingMeters,
        cuttingMeters: totalCuttingMeters
      },
      averages: {
        dailyGainInCents: daysWorkedCount > 0 ? Math.round(totalEarnedInCents / daysWorkedCount) : 0,
        dailyPlantingMeters: daysWorkedCount > 0 ? totalPlantingMeters / daysWorkedCount : 0,
        dailyCuttingMeters: daysWorkedCount > 0 ? totalCuttingMeters / daysWorkedCount : 0
      },
      details: {
        productions,
        wages: dailyWages,
        drivers,
        advances,
        presence: presenceDetails
      },
      insights: {
        gainEvolution,
        productivityEvolution,
        mostProductiveDay: mostProductiveDay ? { date: mostProductiveDay.date, meters: mostProductiveDay.planting + mostProductiveDay.cutting } : undefined
      }
    }
  }

  static async getMonthsWithData(employeeId: string, seasonId: string): Promise<{ year: number; month: number }[]> {
    const [p, w, d, a] = await Promise.all([
      prisma.plantingProduction.findMany({
        where: { employeeId, seasonId },
        select: { date: true }
      }),
      prisma.dailyWage.findMany({
        where: { employeeId, seasonId },
        select: { date: true }
      }),
      prisma.driverAllocation.findMany({
        where: { employeeId, seasonId },
        select: { date: true }
      }),
      prisma.plantingAdvance.findMany({
        where: { employeeId, seasonId },
        select: { date: true }
      })
    ])

    const allDates = [...p, ...w, ...d, ...a].map(item => item.date)
    const monthsSet = new Set<string>()
    
    allDates.forEach(date => {
      const y = date.getUTCFullYear()
      const m = date.getUTCMonth() + 1
      monthsSet.add(`${y}-${m}`)
    })

    return Array.from(monthsSet)
      .map(s => {
        const [year, month] = s.split("-").map(Number)
        return { year, month }
      })
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year
        return b.month - a.month
      })
  }
}
