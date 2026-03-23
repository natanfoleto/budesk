import { 
  AttendanceType, 
  DailyWage,
  DriverAllocation,
  EmployeeAccount,
  PlantingAdvance,
  PlantingProduction,
  PlantingProductionType} from "@prisma/client"
import { endOfDay,startOfDay } from "date-fns"

import prisma from "@/lib/prisma"

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
      gte: startOfDay(startDate),
      lte: endOfDay(endDate)
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
        workedDates.add(p.date.toISOString().split("T")[0])
        if (p.type === (PlantingProductionType.PLANTIO as string)) totalPlantingMeters += Number(p.meters || 0)
        else totalCuttingMeters += Number(p.meters || 0)
      }
    })

    dailyWages.forEach(w => {
      if (w.presence === (AttendanceType.PRESENCA as string) || w.presence === (AttendanceType.FOLGA as string)) {
        totalEarnedInCents += w.valueInCents
        workedDates.add(w.date.toISOString().split("T")[0])
      }
    })

    drivers.forEach(d => {
      totalEarnedInCents += d.valueInCents
      workedDates.add(d.date.toISOString().split("T")[0])
    })

    const totalAdvancesInCents = advances.reduce((acc, curr) => acc + curr.valueInCents, 0)

    // Detailed presence calculation
    const allDates = new Set<string>()
    productions.forEach(p => allDates.add(p.date.toISOString().split("T")[0]))
    dailyWages.forEach(w => allDates.add(w.date.toISOString().split("T")[0]))
    drivers.forEach(d => allDates.add(d.date.toISOString().split("T")[0]))

    const sortedDates = Array.from(allDates).sort()
    const presenceDetails: { date: string; status: string }[] = []

    sortedDates.forEach(dateStr => {
      const dayProds = productions.filter(p => p.date.toISOString().split("T")[0] === dateStr)
      const dayWages = dailyWages.filter(w => w.date.toISOString().split("T")[0] === dateStr)
      const isDriver = drivers.some(d => d.date.toISOString().split("T")[0] === dateStr)

      const hasPresence = dayProds.some(p => p.presence === (AttendanceType.PRESENCA as string)) || 
                          dayWages.some(w => w.presence === (AttendanceType.PRESENCA as string) || w.presence === (AttendanceType.FOLGA as string)) ||
                          isDriver

      if (hasPresence) {
        presenceDetails.push({ date: dateStr, status: "TRABALHADO" })
      } else {
        const absenceType = dayWages.find(w => ["FALTA", "FALTA_JUSTIFICADA", "ATESTADO"].includes(w.presence))?.presence ||
                           dayProds.find(p => ["FALTA", "FALTA_JUSTIFICADA", "ATESTADO"].includes(p.presence))?.presence ||
                           "FALTA"
        presenceDetails.push({ date: dateStr, status: absenceType })
        totalAbsences++
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

      productions.filter(p => p.date.toISOString().split("T")[0] === dateStr && p.presence === (AttendanceType.PRESENCA as string)).forEach(p => {
        dayGain += p.totalValueInCents
        if (p.type === (PlantingProductionType.PLANTIO as string)) dayPlanting += Number(p.meters || 0)
        else dayCutting += Number(p.meters || 0)
      })
      dailyWages.filter(w => w.date.toISOString().split("T")[0] === dateStr && (w.presence === (AttendanceType.PRESENCA as string) || w.presence === (AttendanceType.FOLGA as string))).forEach(w => {
        dayGain += w.valueInCents
      })
      drivers.filter(d => d.date.toISOString().split("T")[0] === dateStr).forEach(d => {
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
}
