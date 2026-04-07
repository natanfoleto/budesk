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

    if (!seasonId) {
      return NextResponse.json({ error: "Safra não identificada" }, { status: 400 })
    }

    const months = await PlantingEmployeeService.getMonthsWithData(id, seasonId)

    return NextResponse.json(months)
  } catch (error) {
    console.error(error)
    const message = error instanceof Error ? error.message : "Erro ao buscar meses"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
