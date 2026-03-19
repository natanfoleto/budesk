import JSZip from "jszip"
import { NextRequest, NextResponse } from "next/server"

import prisma from "@/lib/prisma"
import { PlantingReportService } from "@/src/modules/planting/services/PlantingReportService"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type") // "individual", "consolidated", "all-zip"
    const employeeId = searchParams.get("employeeId")
    const seasonId = searchParams.get("seasonId")
    const startDateStr = searchParams.get("startDate")
    const endDateStr = searchParams.get("endDate")

    if (!seasonId || !startDateStr || !endDateStr) {
      return NextResponse.json({ error: "seasonId, startDate and endDate are required" }, { status: 400 })
    }

    const startDate = new Date(startDateStr + "T00:00:00Z")
    const endDate = new Date(endDateStr + "T23:59:59Z")

    // Validation for monthly reports (if applicable)
    const isMonthly = searchParams.get("isMonthly") === "true"
    if (isMonthly) {
      const year = startDate.getUTCFullYear()
      const month = startDate.getUTCMonth()
      // Check if both fortnights are closed
      const isClosed = await PlantingReportService.isMonthClosed(seasonId, year, month)
      if (!isClosed) {
        return NextResponse.json({ error: "Para gerar o relatório mensal, as duas quinzenas do mês precisam estar fechadas." }, { status: 400 })
      }

      // Force full month dates
      startDate.setUTCDate(1)
      endDate.setUTCMonth(startDate.getUTCMonth() + 1, 0)
      endDate.setUTCHours(23, 59, 59, 999)
    }

    const dateRangeSuffix = `${startDate.toISOString().split("T")[0]}_${endDate.toISOString().split("T")[0]}`
    const periodType = isMonthly ? "mensal" : "quinzenal"

    if (type === "individual") {
      if (!employeeId) return NextResponse.json({ error: "employeeId is required for individual report" }, { status: 400 })
      const pdf = await PlantingReportService.generateIndividualReport(employeeId, seasonId, startDate, endDate)
      
      return new NextResponse(pdf, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="relatorio_individual_plantio_${periodType}_${dateRangeSuffix}.pdf"`
        }
      })
    }

    if (type === "consolidated") {
      const pdf = await PlantingReportService.generateConsolidatedReport(seasonId, startDate, endDate, isMonthly)
      return new NextResponse(pdf, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="relatorio_geral_plantio_${periodType}_${dateRangeSuffix}.pdf"`
        }
      })
    }

    if (type === "all-zip") {
      const { shouldShowEmployeeInMonth } = await import("@/lib/utils/planting-utils")
      const allEmployees = await prisma.employee.findMany({
        include: {
          employmentRecords: {
            orderBy: { admissionDate: 'desc' },
            take: 1
          }
        }
      })

      const employees = allEmployees.filter(emp => {
        const termDate = emp.employmentRecords[0]?.terminationDate
        return shouldShowEmployeeInMonth(startDate, termDate)
      }).sort((a, b) => a.name.localeCompare(b.name))

      const zip = new JSZip()
      
      const promises = employees.map(async (emp) => {
        try {
          const pdf = await PlantingReportService.generateIndividualReport(emp.id, seasonId, startDate, endDate)
          zip.file(`${emp.name.replace(/\s+/g, "_")}.pdf`, pdf)
        } catch (e) {
          console.error(`Error generating PDF for employee ${emp.id}:`, e)
        }
      })

      await Promise.all(promises)

      const zipContent = await zip.generateAsync({ type: "nodebuffer" })

      return new NextResponse(zipContent as unknown as BodyInit, {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="relatorios_individuais_plantio_${periodType}_${dateRangeSuffix}.zip"`
        }
      })
    }

    if (type === "closing") {
      const pdf = await PlantingReportService.generateClosingReport(seasonId, startDate, endDate)
      return new NextResponse(pdf, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="relatorio_fechamento_${startDateStr}_${endDateStr}.pdf"`
        }
      })
    }

    return NextResponse.json({ error: "Invalid report type" }, { status: 400 })
  } catch (error: unknown) {
    console.error("Error generating reports:", error)
    const message = error instanceof Error ? error.message : "Failed to generate report"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
