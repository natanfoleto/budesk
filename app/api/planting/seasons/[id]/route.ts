import { NextResponse } from "next/server"

import { PlantingSeasonService } from "@/src/modules/planting/services/PlantingSeasonService"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    // Await params if Next.js > 14 requires it, typically params is handled async now
    const awaitedParams = await params
    const season = await PlantingSeasonService.getById(awaitedParams.id)
    if (!season) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(season)
  } catch (error) {
    console.error("Error fetching season:", error)
    return NextResponse.json({ error: "Failed to fetch season" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const awaitedParams = await params
    const data = await req.json()
    const userId = "root" 
    const season = await PlantingSeasonService.update(awaitedParams.id, data, userId)
    return NextResponse.json(season)
  } catch (error) {
    console.error("Error updating season:", error)
    return NextResponse.json({ error: "Failed to update season" }, { status: 500 })
  }
}
