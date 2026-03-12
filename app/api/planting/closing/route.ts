import { NextResponse } from "next/server"

import { PlantingClosingService } from "@/src/modules/planting/services/PlantingClosingService"

export async function POST(req: Request) {
  try {
    const { seasonId, startDate, endDate } = await req.json()
    if (!seasonId || !startDate || !endDate) {
      return NextResponse.json({ error: "seasonId, startDate and endDate are required" }, { status: 400 })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    // Se quiser considerar até as 23:59:59 do endDate:
    end.setHours(23, 59, 59, 999)

    const result = await PlantingClosingService.closePeriod(seasonId, start, end)
    
    return NextResponse.json({ message: "Fechamento realizado com sucesso", result })
  } catch (error: unknown) {
    console.error("Error during closing:", error)
    const message = error instanceof Error ? error.message : "Failed to close period"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
