import { NextResponse } from "next/server"

import { WorkFrontService } from "@/src/modules/planting/services/WorkFrontService"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const seasonId = searchParams.get('seasonId') || undefined
    const fronts = await WorkFrontService.list(seasonId)
    return NextResponse.json(fronts)
  } catch (error) {
    console.error("Error fetching work fronts:", error)
    return NextResponse.json({ error: "Failed to fetch work fronts" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const userId = "root" 
    const front = await WorkFrontService.create(data, userId)
    return NextResponse.json(front, { status: 201 })
  } catch (error) {
    console.error("Error creating work front:", error)
    return NextResponse.json({ error: "Failed to create work front" }, { status: 500 })
  }
}
