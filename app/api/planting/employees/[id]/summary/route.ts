import { NextRequest, NextResponse } from "next/server"

import { PlantingEmployeeService } from "@/src/modules/planting/services/PlantingEmployeeService"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { searchParams } = new URL(request.url)
    const seasonId = searchParams.get("seasonId")
    const startDateStr = searchParams.get("startDate")
    const endDateStr = searchParams.get("endDate")

    if (!seasonId) {
      return NextResponse.json({ error: "Safra não identificada" }, { status: 400 })
    }

    const startDate = startDateStr ? new Date(startDateStr) : undefined
    const endDate = endDateStr ? new Date(endDateStr) : undefined

    const summary = await PlantingEmployeeService.getSummary(
      id,
      seasonId,
      startDate,
      endDate
    )

    return NextResponse.json(summary)
  } catch (error) {
    console.error(error)
    const message = error instanceof Error ? error.message : "Erro ao buscar resumo"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
