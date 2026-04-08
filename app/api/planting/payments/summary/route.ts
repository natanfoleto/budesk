import { NextRequest, NextResponse } from "next/server"

import { PlantingEmployeeService } from "@/src/modules/planting/services/PlantingEmployeeService"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const seasonId = searchParams.get("seasonId")
    const startDateStr = searchParams.get("startDate")
    const endDateStr = searchParams.get("endDate")

    if (!seasonId) {
      return NextResponse.json({ error: "Safra não identificada" }, { status: 400 })
    }

    const parseDate = (dateStr: string | null, isEnd: boolean) => {
      if (!dateStr) return undefined
      const [y, m, d] = dateStr.split("-").map(Number)
      if (isEnd) {
        return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999))
      }
      return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0))
    }

    const startDate = parseDate(startDateStr, false)
    const endDate = parseDate(endDateStr, true)

    const summaries = await PlantingEmployeeService.getAllSummaries(
      seasonId,
      startDate,
      endDate
    )

    return NextResponse.json(summaries)
  } catch (error) {
    console.error(error)
    const message = error instanceof Error ? error.message : "Erro ao buscar resumos"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
