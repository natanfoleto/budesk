import { format, getDay, getDaysInMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { jsPDF } from "jspdf"
import autoTable, { RowInput } from "jspdf-autotable"

import prisma from "@/lib/prisma"
import { isBeforeAdmission, isEmployeeActiveAtDate, shouldShowEmployeeInMonth } from "@/lib/utils/planting-utils"

import { PlantingDashboardService } from "./PlantingDashboardService"

type TableCell = string | number | { 
  content: string | number; 
  colSpan?: number; 
  styles?: { 
    fontStyle?: "normal" | "bold" | "" | "bold"; 
    fillColor?: [number, number, number]; 
    halign?: 'left' | 'center' | 'right';
    textColor?: [number, number, number];
  } 
};

// Types for the report data to avoid 'any'
interface ProductionRecord {
  type: string
  meters: number | null
  totalValueInCents: number
  date: Date
  presence: string
}

interface WageRecord {
  valueInCents: number
  date: Date
  presence: string
}

interface AdvanceRecord {
  valueInCents: number
  date: Date
  discountInCurrentFortnight: boolean
}

interface EmploymentRecord {
  terminationDate: Date | string | null
  admissionDate: Date | string
  baseSalaryInCents: number
}

interface EmployeeWithReportData {
  id: string
  name: string
  plantingProductions: ProductionRecord[]
  dailyWages: WageRecord[]
  driverAllocations: WageRecord[]
  plantingAdvances: AdvanceRecord[]
  employmentRecords: EmploymentRecord[]
}

// Extend jsPDF with autotable types
declare module "jspdf" {
  interface jsPDF {
    // autoTable: (options: unknown) => jsPDF // Removed to use functional style
    lastAutoTable: {
      finalY: number
    }
  }
}

export class PlantingReportService {
  private static formatCurrency(cents: number) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100)
  }

  private static formatDateUTC(date: Date) {
    // Add 12 hours to avoid timezone shifting to the previous day
    const d = new Date(date)
    d.setUTCHours(12, 0, 0, 0)
    return format(d, "dd/MM/yyyy")
  }

  private static getISODate(date: Date) {
    return date.toISOString().split("T")[0]
  }

  static async generateIndividualReport(
    employeeId: string, 
    seasonId: string, 
    startDate: Date, 
    endDate: Date,
    options: { shouldCompensate?: boolean } = { shouldCompensate: false }
  ) {
    const employee = (await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        employmentRecords: {
          orderBy: { admissionDate: 'desc' },
          take: 1,
        },
        plantingProductions: {
          where: { seasonId, date: { gte: startDate, lte: endDate } },
          orderBy: { date: "asc" },
        },
        dailyWages: {
          where: { seasonId, date: { gte: startDate, lte: endDate } },
          orderBy: { date: "asc" },
        },
        driverAllocations: {
          where: { seasonId, date: { gte: startDate, lte: endDate } },
          orderBy: { date: "asc" },
        },
        plantingAdvances: {
          where: { seasonId, date: { gte: startDate, lte: endDate }, discountInCurrentFortnight: true },
          orderBy: { date: "asc" },
        },
      },
    }) as unknown) as EmployeeWithReportData

    if (!employee) throw new Error("Funcionário não encontrado")

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()

    // Header
    doc.setFontSize(18)
    doc.text("Relatório de Produção - Plantio Manual", 14, 22)
    doc.setFontSize(10)
    doc.text(`Período: ${this.formatDateUTC(startDate)} a ${this.formatDateUTC(endDate)}`, 14, 30)
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, pageWidth - 14, 30, { align: "right" })

    // Employee Data
    doc.setFontSize(12)
    const admissionDate = employee.employmentRecords?.[0]?.admissionDate
    const terminationDate = employee.employmentRecords?.[0]?.terminationDate
    doc.text(`Funcionário: ${employee.name}`, 14, 45)
    
    let infoY = 50
    if (admissionDate) {
      doc.setFontSize(9)
      doc.setTextColor(0, 100, 0) // Verde para admissão
      doc.text(`Contrato iniciado em ${this.formatDateUTC(new Date(admissionDate))}`, 14, infoY)
      infoY += 5
      doc.setTextColor(0)
    }

    if (terminationDate) {
      doc.setFontSize(9)
      doc.setTextColor(150, 0, 0) // Vermelho para encerramento
      doc.text(`Contrato encerrado em ${this.formatDateUTC(new Date(terminationDate))}`, 14, infoY)
      infoY += 5
      doc.setTextColor(0)
    }
    
    doc.setFont("helvetica", "normal")

    const dates = new Set<string>()
    employee.plantingProductions.forEach((p) => dates.add(this.getISODate(p.date)))
    employee.dailyWages.forEach((w) => dates.add(this.getISODate(w.date)))
    employee.driverAllocations.forEach((a) => dates.add(this.getISODate(a.date)))

    const sortedDates = Array.from(dates)
      .filter(dateStr => isEmployeeActiveAtDate(dateStr, terminationDate) && !isBeforeAdmission(dateStr, admissionDate))
      .sort()

    // Salary calculation helpers
    const baseSalary = employee.employmentRecords?.[0]?.baseSalaryInCents || 0
    const daysInMonth = getDaysInMonth(startDate)
    const dailyRate = Math.floor(baseSalary / daysInMonth)

    // 1. Identify and Pair Compensations (Chronological)
    const allFaltas = sortedDates.filter(dateStr => {
      const wages = employee.dailyWages.filter(w => this.getISODate(w.date) === dateStr)
      const prods = employee.plantingProductions.filter(p => this.getISODate(p.date) === dateStr)
      const hasPresence = prods.some(p => p.presence === "PRESENCA") || 
                         wages.some(w => w.presence === "PRESENCA" || w.presence === "FOLGA") ||
                         employee.driverAllocations.some(a => this.getISODate(a.date) === dateStr)
      
      if (hasPresence) return false
      
      const pType = wages.find(w => w.presence === "FALTA")?.presence || prods.find(p => p.presence === "FALTA")?.presence
      return pType === "FALTA"
    }).sort()

    const allFolga = sortedDates.filter(dateStr => {
      return employee.dailyWages.some(w => this.getISODate(w.date) === dateStr && w.presence === "FOLGA")
    }).sort()

    const compensations: { falta: string, folga: string }[] = []
    
    if (options.shouldCompensate !== false) {
      // Regra: Apenas folgas que não sejam domingo compensam faltas.
      const validFolgasForCompensations = allFolga.filter(dateStr => {
        const date = new Date(dateStr + "T12:00:00")
        return getDay(date) !== 0
      })

      const maxCompensations = Math.min(allFaltas.length, validFolgasForCompensations.length)
      for (let i = 0; i < maxCompensations; i++) {
        compensations.push({
          falta: allFaltas[i],
          folga: validFolgasForCompensations[i]
        })
      }
    }

    // Daily production table
    const tableData: TableCell[][] = []
    
    let totalPlantingMeters = 0
    let totalCuttingMeters = 0
    let totalDailyWage = 0
    let totalAdvances = 0
    let totalFolgaChuvaInCents = 0
    let totalFolgaDomingoInCents = 0
    let totalBruto = 0

    sortedDates.forEach(dateStr => {
      const date = new Date(dateStr + "T12:00:00")
      const productions = employee.plantingProductions.filter((p) => this.getISODate(p.date) === dateStr)
      const wages = employee.dailyWages.filter((w) => this.getISODate(w.date) === dateStr)
      const drivers = employee.driverAllocations.filter((a) => this.getISODate(a.date) === dateStr)
      const advances = employee.plantingAdvances.filter((adv) => this.getISODate(adv.date) === dateStr)

      let dailyPlanting = 0
      let dailyCutting = 0
      let dailyWageValue = 0
      let dailyAdvanceValue = 0
      const services: string[] = []

      productions.forEach((p) => {
        if (p.presence === "PRESENCA") {
          if (p.type === "PLANTIO") {
            dailyPlanting += Number(p.meters || 0)
          } else {
            dailyCutting += Number(p.meters || 0)
          }
          services.push(p.type === "PLANTIO" ? "Plantio" : "Corte")
          totalBruto += p.totalValueInCents
        }
      })

      wages.forEach((w) => {
        const isCompensatedFalta = compensations.some(c => c.falta === dateStr)
        const isUsedFolga = compensations.some(c => c.folga === dateStr)
        const isSunday = getDay(date) === 0

        if (w.presence === "PRESENCA" || w.presence === "FOLGA") {
          const isPresence = w.presence === "PRESENCA"
          const hasManualValue = w.valueInCents > 0
          
          if (hasManualValue || !isPresence) {
            let label = isPresence ? "Diária" : "Folga"
            let valueToApply = w.valueInCents

            if (w.presence === "FOLGA") {
              if (!isSunday) {
                label = "Folga (Chuva)"
                if (!isUsedFolga && valueToApply === 0) {
                  // Se shouldCompensate for falso, não paga a folga de chuva (R$ 0,00)
                  valueToApply = options.shouldCompensate !== false ? dailyRate : 0
                }
                totalFolgaChuvaInCents += valueToApply
              } else {
                label = "Folga (Domingo)"
                if (valueToApply === 0) {
                  // Domingos nunca são compensados (regra nova), logo isUsedFolga não se aplica aqui.
                  // Se shouldCompensate for falso, não paga o domingo (R$ 0,00)
                  valueToApply = options.shouldCompensate !== false ? dailyRate : 0
                }
                totalFolgaDomingoInCents += valueToApply
              }
            }

            dailyWageValue += valueToApply
            services.push(label)
            totalBruto += valueToApply
          }
        } else {
          // Add label for absence/medical certificate
          let label = w.presence
          let valueToApply = 0

          if (w.presence === "FALTA") {
            label = "Falta"
            if (!isCompensatedFalta) {
              // Se não for compensada e a compensação estiver ativa, desconta.
              // Se a compensação estiver DESATIVADA (options.shouldCompensate === false), a falta não desconta (user request: "mostrar produção, diárias de chuva, domingos")
              valueToApply = options.shouldCompensate !== false ? -dailyRate : 0
            }
          }
          else if (w.presence === "FALTA_JUSTIFICADA") label = "Falta Justificada"
          else if (w.presence === "ATESTADO") label = "Atestado"
          
          dailyWageValue += valueToApply
          totalBruto += valueToApply
          services.push(label)
        }
      })

      drivers.forEach((d) => {
        dailyWageValue += d.valueInCents
        services.push("Motorista")
        totalBruto += d.valueInCents
      })

      advances.forEach((adv) => {
        dailyAdvanceValue += adv.valueInCents
        totalAdvances += adv.valueInCents
      })

      const dailyTotal = productions.filter(p => p.presence === "PRESENCA").reduce((acc: number, p) => acc + p.totalValueInCents, 0) + dailyWageValue

      const isCompensatedFalta = compensations.some(c => c.falta === dateStr)
      const isUsedFolga = compensations.some(c => c.folga === dateStr)

      let serviceCell: TableCell = services.join(", ")
      if (isCompensatedFalta) {
        serviceCell = {
          content: services.join(", "),
          styles: { textColor: [0, 150, 0] } // Green text for compensated Falta
        }
      } else if (isUsedFolga) {
        serviceCell = {
          content: services.join(", "),
          styles: { textColor: [255, 100, 100] } // Light red text for NT used for compensation
        }
      }

      const isCalculatedDiscount = services.includes("Falta") && dailyWageValue === -dailyRate

      tableData.push([
        `${format(date, "dd/MM/yyyy")} (${format(date, "EEEE", { locale: ptBR }).slice(0, 3).toLowerCase()})`,
        serviceCell,
        dailyPlanting > 0 ? `${dailyPlanting}m` : "-",
        dailyCutting > 0 ? `${dailyCutting}m` : "-",
        (dailyWageValue !== 0 && !isCalculatedDiscount) ? this.formatCurrency(dailyWageValue) : "-",
        dailyAdvanceValue > 0 ? this.formatCurrency(dailyAdvanceValue) : "-",
        this.formatCurrency(dailyTotal)
      ])

      totalPlantingMeters += dailyPlanting
      totalCuttingMeters += dailyCutting
      totalDailyWage += dailyWageValue
    })

    // Add Totals row to table data
    tableData.push([
      { content: "Total", colSpan: 2, styles: { fontStyle: "bold", fillColor: [240, 240, 240] } },
      { content: totalPlantingMeters > 0 ? `${totalPlantingMeters}m` : "-", styles: { fontStyle: "bold", fillColor: [240, 240, 240] } },
      { content: totalCuttingMeters > 0 ? `${totalCuttingMeters}m` : "-", styles: { fontStyle: "bold", fillColor: [240, 240, 240] } },
      { content: totalDailyWage > 0 ? this.formatCurrency(totalDailyWage) : "-", styles: { fontStyle: "bold", fillColor: [240, 240, 240] } },
      { content: totalAdvances > 0 ? this.formatCurrency(totalAdvances) : "-", styles: { fontStyle: "bold", fillColor: [240, 240, 240] } },
      { content: this.formatCurrency(totalBruto), styles: { fontStyle: "bold", fillColor: [240, 240, 240] } }
    ])

    let tableStartY = 55
    if (admissionDate) tableStartY += 5
    if (terminationDate) tableStartY += 5

    autoTable(doc, {
      startY: tableStartY,
      head: [["Data", "Serviço", "Plantio", "Corte", "Diária", "Adiant.", "Total Dia"]],
      body: tableData as RowInput[],
      theme: "striped",
      headStyles: { fillColor: [41, 128, 185] },
      margin: { top: 40 },
    })

    let currentY = doc.lastAutoTable.finalY + 15

    const checkPageSpace = (heightNeeded: number) => {
      const pageHeight = doc.internal.pageSize.getHeight()
      if (currentY + heightNeeded > pageHeight - 20) {
        doc.addPage()
        currentY = 20
        return true
      }
      return false
    }

    // Traceability Section: Compensação de Faltas
    if (options.shouldCompensate !== false && compensations.length > 0) {
      const needed = 25 + (compensations.length * 7)
      checkPageSpace(needed)

      doc.setFont("helvetica", "bold")
      doc.setFontSize(12)
      doc.text("Compensação de Faltas", 14, currentY)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      
      const compTableData = compensations.map(c => [
        format(new Date(c.falta + "T12:00:00"), "dd/MM/yyyy"),
        "Falta",
        format(new Date(c.folga + "T12:00:00"), "dd/MM/yyyy")
      ])

      autoTable(doc, {
        startY: currentY + 5,
        head: [["Data da Falta", "Tipo", "Compensado por (Folga)"]],
        body: compTableData,
        theme: "grid",
        headStyles: { fillColor: [127, 140, 141] },
        styles: { fontSize: 9 },
        margin: { left: 14 }
      })

      currentY = doc.lastAutoTable.finalY + 15
    }

    // Resumo da Produção (RESTRINGIR AO PERÍODO ATUAL: sortedDates)
    const summaryNeeded = 40
    checkPageSpace(summaryNeeded)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.text("Resumo da Produção", 14, currentY)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)

    // Non-Sunday folgas
    const nonSundayFolgas = allFolga.filter(f => getDay(new Date(f + "T12:00:00")) !== 0)
    // Sunday / Regular rest days
    const regularFolgasCount = allFolga.length - nonSundayFolgas.length
    
    // Count days for stats
    let justifiedAbsenceCount = 0
    let atestadoCount = 0
    let workedDaysCount = 0

    sortedDates.forEach(dateStr => {
      const wages = employee.dailyWages.filter(w => this.getISODate(w.date) === dateStr)
      const prods = employee.plantingProductions.filter(p => this.getISODate(p.date) === dateStr)

      const hasPresence = prods.some(p => p.presence === "PRESENCA") ||
                         wages.some(w => w.presence === "PRESENCA") ||
                         employee.driverAllocations.some(a => this.getISODate(a.date) === dateStr)

      if (hasPresence) {
        workedDaysCount++
      } else {
        const presenceType = wages.find(w => ["FALTA_JUSTIFICADA", "ATESTADO"].includes(w.presence))?.presence || 
                            prods.find(p => ["FALTA_JUSTIFICADA", "ATESTADO"].includes(p.presence))?.presence
        
        if (presenceType === "FALTA_JUSTIFICADA") justifiedAbsenceCount++
        else if (presenceType === "ATESTADO") atestadoCount++
      }
    })

    // totalBruto already includes extraFolgaValue and faltaDiscountValue from the loop

    const summaryData = [
      ["Folgas regulares / Domingos", regularFolgasCount],
      ["Dias de chuva", nonSundayFolgas.length],
      ["Faltas", allFaltas.length],
      ["Faltas justificadas", justifiedAbsenceCount],
      ["Atestados médicos", atestadoCount],
      ["Total de dias trabalhados", workedDaysCount],
    ]

    if (options.shouldCompensate !== false) {
      summaryData.splice(3, 0, ["Faltas compensadas", compensations.length])
    }

    autoTable(doc, {
      startY: currentY + 5,
      body: summaryData,
      theme: "plain",
      styles: { cellPadding: 1 },
      columnStyles: { 0: { cellWidth: 50 }, 1: { fontStyle: "bold" } },
      margin: { left: 14 }
    })

    currentY = doc.lastAutoTable.finalY + 15

    // Totals Box (Simplified and Color-Coded)
    const totalsNeeded = 50
    checkPageSpace(totalsNeeded)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.text("Totais", 14, currentY)
    
    doc.setFontSize(12)
    doc.setTextColor(0)
    currentY += 10
    doc.text(`Total Bruto: ${this.formatCurrency(totalBruto)}`, 14, currentY)
    
    currentY += 8
    doc.setTextColor(200, 0, 0)
    doc.text(`Total Adiantamentos: - ${this.formatCurrency(totalAdvances)}`, 14, currentY)
    
    currentY += 8
    doc.setTextColor(0, 100, 0)
    doc.text(`Total Líquido: ${this.formatCurrency(totalBruto - totalAdvances)}`, 14, currentY)

    // Detalhamento de Folgas (Fonte menor)
    if (totalFolgaDomingoInCents > 0 || totalFolgaChuvaInCents > 0) {
      doc.setFontSize(8)
      doc.setTextColor(100)
      currentY += 6
      doc.text(`Incluído no Bruto: ${this.formatCurrency(totalFolgaDomingoInCents)} de Domingos e ${this.formatCurrency(totalFolgaChuvaInCents)} de Dias de chuva.`, 14, currentY)
    }

    // Reset color for other operations
    doc.setTextColor(0)

    // CLT Disclaimer
    const disclaimerHeight = 20
    checkPageSpace(disclaimerHeight + 25)
    currentY += 15

    doc.setFontSize(8)
    doc.setTextColor(100)
    doc.text("O total líquido apresentado poderá sofrer descontos trabalhistas conforme a CLT.", 14, currentY)
    
    if (options.shouldCompensate !== false) {
      doc.text("Os dias de chuva não trabalhados são utilizados para compensar faltas não justificadas.", 14, currentY + 5)
      doc.text("Os dias de chuva não trabalhados que não foram compensados por faltas, serão pagos proporcionalmente ao salário registrado em carteira.", 14, currentY + 10)
    }

    // Company Footer
    currentY += 20
    doc.setFont("helvetica", "bold")
    doc.text("BUDUCA EMPREITEIRA LTDA", 14, currentY)
    doc.setFont("helvetica", "normal")
    doc.text("CNPJ: 49.197.058/0001-66", 14, currentY + 4)
    doc.text("R LIBERDADE, 704 - Centro - Jaborandi, SP", 14, currentY + 8)

    return doc.output("arraybuffer")
  }

  static async generateConsolidatedReport(seasonId: string, startDate: Date, endDate: Date, isMonthly?: boolean, shouldCompensate: boolean = false) {
    const employees = (await prisma.employee.findMany({
      include: {
        employmentRecords: {
          orderBy: { admissionDate: 'desc' },
          take: 1,
        },
        plantingProductions: { where: { seasonId, date: { gte: startDate, lte: endDate } } },
        dailyWages: { where: { seasonId, date: { gte: startDate, lte: endDate } } },
        driverAllocations: { where: { seasonId, date: { gte: startDate, lte: endDate } } },
        plantingAdvances: { where: { seasonId, date: { gte: startDate, lte: endDate }, discountInCurrentFortnight: true } },
      }
    }) as unknown) as EmployeeWithReportData[]

    const doc = new jsPDF("landscape")

    doc.setFontSize(18)
    doc.text(isMonthly ? "Relatório Consolidado do Mês" : "Relatório Consolidado da Quinzena", 14, 22)
    doc.setFontSize(10)
    doc.text(`Período: ${this.formatDateUTC(startDate)} a ${this.formatDateUTC(endDate)}`, 14, 30)
    const pageWidth = doc.internal.pageSize.getWidth()
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, pageWidth - 14, 30, { align: "right" })

    const tableData: TableCell[][] = []
    let grandTotalBruto = 0
    let grandTotalLiquido = 0

    // Filter employees based on termination date relative to report period
    const filteredEmployees = employees.filter(emp => {
      const terminationDate = emp.employmentRecords[0]?.terminationDate
      return shouldShowEmployeeInMonth(startDate, terminationDate)
    }).sort((a, b) => a.name.localeCompare(b.name))

    filteredEmployees.forEach(emp => {
      const baseSalary = emp.employmentRecords?.[0]?.baseSalaryInCents || 0
      const daysInMonth = getDaysInMonth(startDate)
      const dailyRate = Math.floor(baseSalary / daysInMonth)

      let bruto = 0
      let adiantado = 0
      let plantio = 0
      let corte = 0
      let diarias = 0
      let faltas = 0
      let faltasJustificadas = 0
      let atestados = 0
      const presencas = new Set<string>()

      const terminationDate = emp.employmentRecords[0]?.terminationDate

      emp.plantingProductions.forEach((p) => {
        if (!isEmployeeActiveAtDate(p.date, terminationDate)) return
        if (p.presence === "PRESENCA") {
          bruto += p.totalValueInCents
          if (p.type === "PLANTIO") plantio += Number(p.meters || 0)
          else corte += Number(p.meters || 0)
          presencas.add(this.getISODate(p.date))
        }
      })

      emp.dailyWages.forEach((w) => {
        if (!isEmployeeActiveAtDate(w.date, terminationDate)) return
        const dateStr = this.getISODate(w.date)
        if (w.presence === "PRESENCA" || w.presence === "FOLGA") {
          bruto += w.valueInCents
          diarias += w.valueInCents
          presencas.add(dateStr)
        } else {
          // Avoid counting absence if there's presence on other tabs
          const hasProduction = emp.plantingProductions.some(p => this.getISODate(p.date) === dateStr && p.presence === "PRESENCA")
          const hasDriver = emp.driverAllocations.some(a => this.getISODate(a.date) === dateStr)
          
          if (!hasProduction && !hasDriver) {
            if (w.presence === "FALTA") faltas++
            else if (w.presence === "FALTA_JUSTIFICADA") faltasJustificadas++
            else if (w.presence === "ATESTADO") atestados++
          }
        }
      })

      emp.driverAllocations.forEach((a) => {
        if (!isEmployeeActiveAtDate(a.date, terminationDate)) return
        bruto += a.valueInCents
        diarias += a.valueInCents
        presencas.add(this.getISODate(a.date))
      })

      emp.plantingAdvances.forEach((adv) => {
        if (!isEmployeeActiveAtDate(adv.date, terminationDate)) return
        adiantado += adv.valueInCents
      })

      if (bruto > 0 || adiantado > 0) {
        const allFolgaDates = emp.dailyWages
          .filter(w => w.presence === "FOLGA")
          .map(w => this.getISODate(w.date))
        
        const folgaCount = allFolgaDates.length
        const nonSundayFolgaCount = allFolgaDates.filter(f => getDay(new Date(f + "T12:00:00")) !== 0).length
        
        let compensatedFaltas = 0
        let finalFaltas = faltas

        // Apply financial adjustments
        if (shouldCompensate) {
          compensatedFaltas = Math.min(faltas, folgaCount)
          finalFaltas = faltas - compensatedFaltas
          const extraFolgasCount = Math.max(0, nonSundayFolgaCount - compensatedFaltas)

          const extraFolgaValue = extraFolgasCount * dailyRate
          const faltaDiscountValue = finalFaltas * dailyRate
          
          bruto += extraFolgaValue - faltaDiscountValue
          diarias += extraFolgaValue - faltaDiscountValue
        }
        const liquido = bruto - adiantado

        const sundaysCount = folgaCount - nonSundayFolgaCount

        const absenceGroup = [
          finalFaltas > 0 ? `FT: ${finalFaltas}` : null,
          faltasJustificadas > 0 ? `FJ: ${faltasJustificadas}` : null,
          atestados > 0 ? `A: ${atestados}` : null,
          sundaysCount > 0 ? `D: ${sundaysCount}` : null,
          nonSundayFolgaCount > 0 ? `CH: ${nonSundayFolgaCount}` : null,
          compensatedFaltas > 0 ? `C: ${compensatedFaltas}` : null
        ].filter(Boolean).join("\n")

        tableData.push([
          emp.name,
          presencas.size,
          absenceGroup || "-",
          `${plantio}m`,
          `${corte}m`,
          this.formatCurrency(diarias),
          this.formatCurrency(adiantado),
          this.formatCurrency(bruto),
          this.formatCurrency(liquido)
        ])
        grandTotalBruto += bruto
        grandTotalLiquido += liquido
      }
    })

    autoTable(doc, {
      startY: 40,
      head: [["Funcionário", "Dias", "Faltas", "Plantio", "Corte", "Diárias", "Adiant.", "Bruto", "Líquido"]],
      body: tableData as RowInput[],
      theme: "grid",
      headStyles: { fillColor: [44, 62, 80] },
      styles: { fontSize: 8, cellPadding: 2, valign: "middle" },
      columnStyles: {
        2: { cellWidth: 20 }
      }
    })

    const finalY = doc.lastAutoTable.finalY + 10
    doc.setFont("helvetica", "bold")
    doc.text(`TOTAL GERAL BRUTO: ${this.formatCurrency(grandTotalBruto)}`, 14, finalY)
    doc.text(`TOTAL GERAL LÍQUIDO: ${this.formatCurrency(grandTotalLiquido)}`, 14, finalY + 7)

    // CLT Disclaimer
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(100)
    doc.text("O total líquido apresentado poderá sofrer descontos trabalhistas conforme a CLT.", 14, finalY + 15)
    if (shouldCompensate) {
      doc.text("Os dias de chuva não trabalhados são utilizados para compensar faltas não justificadas.", 14, finalY + 20)
    }

    return doc.output("arraybuffer")
  }

  static async generateClosingReport(seasonId: string, startDate: Date, endDate: Date) {
    const metrics = await PlantingDashboardService.getOverviewMetrics(
      seasonId, 
      this.getISODate(startDate), 
      this.getISODate(endDate)
    )

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()

    // Header
    doc.setFontSize(22)
    doc.setTextColor(41, 128, 185)
    doc.text("Resumo de Fechamento - Plantio Manual", pageWidth / 2, 25, { align: "center" })
    
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`Período: ${this.formatDateUTC(startDate)} a ${this.formatDateUTC(endDate)}`, pageWidth / 2, 32, { align: "center" })
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, pageWidth - 14, 32, { align: "right" })

    // 1. Principal Metrics Cards
    autoTable(doc, {
      startY: 45,
      head: [["Métrica", "Valor"]],
      body: [
        ["Custo Total no Período", this.formatCurrency(metrics.totalCostInCents)],
        ["Área Trabalhada", `${Number(metrics.totalHectares).toFixed(2)} ha`],
        ["Produção Total (Metros)", `${metrics.totalMeters.toLocaleString()}m`],
        ["Metragem de Plantio", `${metrics.totalPlantingMeters.toLocaleString()}m`],
        ["Metragem de Corte", `${metrics.totalCuttingMeters.toLocaleString()}m`],
        ["Custo Automático por Hectare", this.formatCurrency(metrics.costPerHectareInCents)],
      ],
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185] },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 80 } }
    })

    // 2. Cost Breakdown
    doc.setFontSize(14)
    doc.setTextColor(0)
    doc.setFont("helvetica", "bold")
    doc.text("Detalhamento por Categoria", 14, doc.lastAutoTable.finalY + 15)

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [["Categoria", "Valor Acumulado", "Representação (%)"]],
      body: [
        ["Plantio", this.formatCurrency(metrics.breakdown.planting), `${((metrics.breakdown.planting / metrics.totalCostInCents) * 100 || 0).toFixed(1)}%`],
        ["Corte", this.formatCurrency(metrics.breakdown.cutting), `${((metrics.breakdown.cutting / metrics.totalCostInCents) * 100 || 0).toFixed(1)}%`],
        ["Diárias", this.formatCurrency(metrics.breakdown.wages), `${((metrics.breakdown.wages / metrics.totalCostInCents) * 100 || 0).toFixed(1)}%`],
        ["Motoristas (Frota)", this.formatCurrency(metrics.breakdown.allocations), `${((metrics.breakdown.allocations / metrics.totalCostInCents) * 100 || 0).toFixed(1)}%`],
        ["Gastos Operacionais", this.formatCurrency(metrics.breakdown.expenses), `${((metrics.breakdown.expenses / metrics.totalCostInCents) * 100 || 0).toFixed(1)}%`],
      ],
      theme: "striped",
      headStyles: { fillColor: [52, 73, 94] },
      columnStyles: { 0: { fontStyle: "bold" }, 2: { halign: "center" } }
    })

    // 3. Totals Summary
    const finalY = doc.lastAutoTable.finalY + 20
    doc.setDrawColor(41, 128, 185)
    doc.setLineWidth(1)
    doc.line(14, finalY, pageWidth - 14, finalY)
    
    doc.setFontSize(16)
    doc.text(`TOTAL GERAL: ${this.formatCurrency(metrics.totalCostInCents)}`, 14, finalY + 12)
    
    doc.setFontSize(8)
    doc.setTextColor(120)
    doc.text("Este relatório é um consolidado automático das métricas de apontamento.", 14, finalY + 22)

    return doc.output("arraybuffer")
  }

  static async isMonthClosed(seasonId: string, year: number, month: number) {
    // 1st Fortnight: 01 to 15
    const start1 = new Date(year, month, 1, 0, 0, 0, 0)
    const end1 = new Date(year, month, 15, 23, 59, 59, 999)

    // 2nd Fortnight: 16 to end
    const start2 = new Date(year, month, 16, 0, 0, 0, 0)
    const end2 = new Date(year, month + 1, 0, 23, 59, 59, 999)

    const [closed1, closed2] = await Promise.all([
      prisma.plantingProduction.findFirst({
        where: { seasonId, date: { gte: start1, lte: end1 }, isClosed: true },
        select: { id: true }
      }),
      prisma.plantingProduction.findFirst({
        where: { seasonId, date: { gte: start2, lte: end2 }, isClosed: true },
        select: { id: true }
      })
    ])

    return !!closed1 && !!closed2
  }
}
