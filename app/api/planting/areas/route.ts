import { NextResponse } from "next/server"

import { PlantingAreaService } from "@/src/modules/planting/services/PlantingAreaService"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const seasonId = searchParams.get('seasonId') || undefined
    const frontId = searchParams.get('frontId') || undefined
    const dateStr = searchParams.get('date')
    const date = dateStr ? new Date(dateStr) : undefined
    
    const areas = await PlantingAreaService.list({ seasonId, frontId, date })
    return NextResponse.json(areas)
  } catch (error) {
    console.error("Error fetching areas:", error)
    return NextResponse.json({ error: "Failed to fetch areas" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const area = await PlantingAreaService.createOrUpdate(data)
    return NextResponse.json(area, { status: 201 })
  } catch (error: unknown) {
    console.error("Error creating area:", error)
    const message = error instanceof Error ? error.message : "Failed to create area"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 })
    
    const deleted = await PlantingAreaService.delete(id)
    return NextResponse.json(deleted)
  } catch (error: unknown) {
    console.error("Error deleting area:", error)
    const message = error instanceof Error ? error.message : "Failed to delete"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
