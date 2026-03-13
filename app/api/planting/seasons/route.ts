import { NextResponse } from "next/server"

import { PlantingSeasonService } from "@/src/modules/planting/services/PlantingSeasonService"

export async function GET() {
  try {
    const seasons = await PlantingSeasonService.list()
    return NextResponse.json(seasons)
  } catch (error) {
    console.error("Error fetching seasons:", error)
    return NextResponse.json({ error: "Failed to fetch seasons" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const userId = req.headers.get("x-user-id")
    
    if (!userId) {
      return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 })
    }

    const season = await PlantingSeasonService.create(data, userId)
    return NextResponse.json(season, { status: 201 })
  } catch (error) {
    console.error("Error creating season:", error)
    return NextResponse.json({ error: "Failed to create season" }, { status: 500 })
  }
}
