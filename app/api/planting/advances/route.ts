import { NextRequest, NextResponse } from "next/server"

import { PlantingAdvanceService } from "@/src/modules/planting/services/PlantingAdvanceService"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const seasonId = searchParams.get("seasonId") || undefined
    const frontId = searchParams.get("frontId") || undefined
    const dateStr = searchParams.get("date")

    const advances = await PlantingAdvanceService.list({
      seasonId,
      frontId,
      date: dateStr ? new Date(dateStr) : undefined
    })

    return NextResponse.json(advances)
  } catch (error: unknown) {
    console.error("Error listing planting advances:", error)
    return NextResponse.json({ error: "Failed to list advances" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const advance = await PlantingAdvanceService.createOrUpdate(data)
    return NextResponse.json(advance)
  } catch (error: unknown) {
    console.error("Error creating planting advance:", error)
    const message = error instanceof Error ? error.message : "Failed to create advance"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
