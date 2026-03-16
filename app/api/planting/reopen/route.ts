import { NextRequest, NextResponse } from "next/server"

import { PlantingClosingService } from "@/src/modules/planting/services/PlantingClosingService"

export async function POST(req: NextRequest) {
  const userRole = req.headers.get("x-user-role")

  if (userRole !== "ROOT" && userRole !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado. Somente administradores podem reabrir períodos." }, { status: 403 })
  }

  try {
    const { seasonId, startDate, endDate } = await req.json()
    if (!seasonId || !startDate || !endDate) {
      return NextResponse.json({ error: "seasonId, startDate and endDate are required" }, { status: 400 })
    }

    // Always use explicit UTC boundaries from the date-only portion to avoid timezone drift
    const startOnly = startDate.split("T")[0]
    const endOnly = endDate.split("T")[0]
    const start = new Date(`${startOnly}T00:00:00.000Z`)
    const end = new Date(`${endOnly}T23:59:59.999Z`)

    const result = await PlantingClosingService.reopenPeriod(seasonId, start, end)

    return NextResponse.json({ message: "Período reaberto com sucesso", result })
  } catch (error: unknown) {
    console.error("Error during reopening:", error)
    const message = error instanceof Error ? error.message : "Falha ao reabrir período"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
