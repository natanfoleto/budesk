import { format } from "date-fns"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

import prisma from "@/lib/prisma"

type TableCell = string | number | { 
  content: string | number; 
  colSpan?: number; 
  styles?: { 
    fontStyle?: "normal" | "bold" | "italic" | "bolditalic"; 
    fillColor?: [number, number, number]; 
    halign?: 'left' | 'center' | 'right';
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

interface EmployeeWithReportData {
  id: string
  name: string
  plantingProductions: ProductionRecord[]
  dailyWages: WageRecord[]
  driverAllocations: WageRecord[]
  plantingAdvances: AdvanceRecord[]
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

  static async generateIndividualReport(employeeId: string, seasonId: string, startDate: Date, endDate: Date) {
    const employee = (await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
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
    doc.setFont("helvetica", "bold")
    doc.text(`Funcionário: ${employee.name}`, 14, 45)
    doc.setFont("helvetica", "normal")

    // Daily production table
    const tableData: TableCell[][] = []
    const dates = new Set<string>()
    employee.plantingProductions.forEach((p) => dates.add(this.getISODate(p.date)))
    employee.dailyWages.forEach((w) => dates.add(this.getISODate(w.date)))
    employee.driverAllocations.forEach((a) => dates.add(this.getISODate(a.date)))

    const sortedDates = Array.from(dates).sort()

    let totalPlantingMeters = 0
    let totalCuttingMeters = 0
    let totalDailyWage = 0
    let totalAdvances = 0
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
        if (w.presence === "PRESENCA") {
          dailyWageValue += w.valueInCents
          services.push("Diária")
          totalBruto += w.valueInCents
        } else {
          // Add label for absence/medical certificate
          let label = w.presence
          if (w.presence === "FALTA") label = "Falta"
          else if (w.presence === "FALTA_JUSTIFICADA") label = "Falta Justificada"
          else if (w.presence === "ATESTADO") label = "Atestado"
          
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

      tableData.push([
        format(date, "dd/MM/yyyy"),
        services.join(", "),
        dailyPlanting > 0 ? `${dailyPlanting}m` : "-",
        dailyCutting > 0 ? `${dailyCutting}m` : "-",
        dailyWageValue > 0 ? this.formatCurrency(dailyWageValue) : "-",
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

    autoTable(doc, {
      startY: 55,
      head: [["Data", "Serviço", "Plantio", "Corte", "Diária", "Adiant.", "Total Dia"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [41, 128, 185] },
      margin: { top: 40 },
    })

    // Summary Section (Labor Statistics)
    const finalY = doc.lastAutoTable.finalY + 15
    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.text("Resumo da Produção", 14, finalY)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)

    const dailyPresenceCount = employee.dailyWages.filter(w => w.presence === "PRESENCA").length + 
                             employee.driverAllocations.length
    
    // Count days with ANY absence and NO presence
    let absenceCount = 0
    let workedDaysCount = 0

    sortedDates.forEach(dateStr => {
      const hasPresence = employee.plantingProductions.some(p => this.getISODate(p.date) === dateStr && p.presence === "PRESENCA") ||
                         employee.dailyWages.some(w => this.getISODate(w.date) === dateStr && w.presence === "PRESENCA") ||
                         employee.driverAllocations.some(a => this.getISODate(a.date) === dateStr)

      const hasAbsence = employee.plantingProductions.some(p => this.getISODate(p.date) === dateStr && ["FALTA", "FALTA_JUSTIFICADA"].includes(p.presence)) ||
                        employee.dailyWages.some(w => this.getISODate(w.date) === dateStr && ["FALTA", "FALTA_JUSTIFICADA"].includes(w.presence || ""))

      if (hasPresence) {
        workedDaysCount++
      } else if (hasAbsence) {
        absenceCount++
      }
    })

    const summaryData = [
      ["Quantidade de diárias", dailyPresenceCount],
      ["Quantidade de faltas", absenceCount],
      ["Total de dias trabalhados", workedDaysCount],
    ]

    autoTable(doc, {
      startY: finalY + 5,
      body: summaryData,
      theme: "plain",
      styles: { cellPadding: 1 },
      columnStyles: { 0: { cellWidth: 50 }, 1: { fontStyle: "bold" } },
      margin: { left: 14 }
    })

    // Totals Box (Simplified and Color-Coded)
    const boxY = doc.lastAutoTable.finalY + 15
    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.text("Totais", 14, boxY)
    
    doc.setFontSize(12)
    doc.setTextColor(0)
    doc.text(`Total Bruto: ${this.formatCurrency(totalBruto)}`, 14, boxY + 10)
    
    doc.setTextColor(200, 0, 0)
    doc.text(`Total Adiantamentos: - ${this.formatCurrency(totalAdvances)}`, 14, boxY + 18)
    
    doc.setTextColor(0, 100, 0)
    doc.text(`Total Líquido: ${this.formatCurrency(totalBruto - totalAdvances)}`, 14, boxY + 26)

    // Reset color for other operations
    doc.setTextColor(0)

    return doc.output("arraybuffer")
  }

  static async generateConsolidatedReport(seasonId: string, startDate: Date, endDate: Date) {
    const employees = (await prisma.employee.findMany({
      where: { active: true },
      include: {
        plantingProductions: { where: { seasonId, date: { gte: startDate, lte: endDate } } },
        dailyWages: { where: { seasonId, date: { gte: startDate, lte: endDate } } },
        driverAllocations: { where: { seasonId, date: { gte: startDate, lte: endDate } } },
        plantingAdvances: { where: { seasonId, date: { gte: startDate, lte: endDate }, discountInCurrentFortnight: true } },
      }
    }) as unknown) as EmployeeWithReportData[]

    const doc = new jsPDF("landscape")

    doc.setFontSize(18)
    doc.text("Relatório Consolidado da Quinzena", 14, 22)
    doc.setFontSize(10)
    doc.text(`Período: ${this.formatDateUTC(startDate)} a ${this.formatDateUTC(endDate)}`, 14, 30)

    const tableData: TableCell[][] = []
    let grandTotalBruto = 0
    let grandTotalLiquido = 0

    employees.forEach(emp => {
      let bruto = 0
      let adiantado = 0
      let plantio = 0
      let corte = 0
      let diarias = 0
      const presencas = new Set<string>()

      emp.plantingProductions.forEach((p) => {
        if (p.presence === "PRESENCA") {
          bruto += p.totalValueInCents
          if (p.type === "PLANTIO") plantio += Number(p.meters || 0)
          else corte += Number(p.meters || 0)
          presencas.add(this.getISODate(p.date))
        }
      })

      emp.dailyWages.forEach((w) => {
        if (w.presence === "PRESENCA") {
          bruto += w.valueInCents
          diarias += w.valueInCents
          presencas.add(this.getISODate(w.date))
        }
      })

      emp.driverAllocations.forEach((a) => {
        bruto += a.valueInCents
        diarias += a.valueInCents
        presencas.add(this.getISODate(a.date))
      })

      emp.plantingAdvances.forEach((adv) => {
        adiantado += adv.valueInCents
      })

      const liquido = bruto - adiantado

      if (bruto > 0 || adiantado > 0) {
        tableData.push([
          emp.name,
          presencas.size,
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
      head: [["Funcionário", "Dias", "Plantio", "Corte", "Diárias", "Adiant.", "Bruto", "Líquido"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [44, 62, 80] },
      styles: { fontSize: 9 }
    })

    const finalY = doc.lastAutoTable.finalY + 10
    doc.setFont("helvetica", "bold")
    doc.text(`TOTAL GERAL BRUTO: ${this.formatCurrency(grandTotalBruto)}`, 14, finalY)
    doc.text(`TOTAL GERAL LÍQUIDO: ${this.formatCurrency(grandTotalLiquido)}`, 14, finalY + 7)

    return doc.output("arraybuffer")
  }
}
