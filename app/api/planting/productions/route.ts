import { NextResponse } from "next/server"

import { PlantingProductionService } from "@/src/modules/planting/services/PlantingProductionService"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const seasonId = searchParams.get('seasonId') || undefined
    const frontId = searchParams.get('frontId') || undefined
    const dateStr = searchParams.get('date')
    const date = dateStr ? new Date(dateStr) : undefined
    
    const tagIds = searchParams.getAll("tagIds").flatMap(t => t.split(",")).filter(Boolean)
    
    const productions = await PlantingProductionService.list({ 
      seasonId, 
      frontId, 
      date,
      tagIds: tagIds.length > 0 ? tagIds : undefined
    })
    return NextResponse.json(productions)
  } catch (error) {
    console.error("Error fetching productions:", error)
    return NextResponse.json({ error: "Failed to fetch productions" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const production = await PlantingProductionService.createOrUpdate(data)
    return NextResponse.json(production, { status: 201 })
  } catch (error: unknown) {
    console.error("Error creating production:", error)
    const message = error instanceof Error ? error.message : "Failed to create production"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
