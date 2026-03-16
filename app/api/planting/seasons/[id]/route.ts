import { NextResponse } from "next/server"

import { PlantingSeasonService } from "@/src/modules/planting/services/PlantingSeasonService"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const season = await PlantingSeasonService.getById(id)
    if (!season) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(season)
  } catch (error) {
    console.error("Error fetching season:", error)
    return NextResponse.json({ error: "Failed to fetch season" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await req.json()
    const userId = req.headers.get("x-user-id")

    if (!userId) {
      return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 })
    }

    const season = await PlantingSeasonService.update(id, data, userId)
    return NextResponse.json(season)
  } catch (error) {
    console.error("Error updating season:", error)
    return NextResponse.json({ error: "Failed to update season" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = req.headers.get("x-user-id")

    if (!userId) {
      return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 })
    }

    const season = await PlantingSeasonService.delete(id, userId)
    return NextResponse.json(season)
  } catch (error) {
    console.error("Error deleting season:", error)
    return NextResponse.json({ error: "Failed to delete season" }, { status: 500 })
  }
}
