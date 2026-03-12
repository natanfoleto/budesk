import { NextResponse } from "next/server"

import { PlantingDashboardService } from "@/src/modules/planting/services/PlantingDashboardService"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const seasonId = searchParams.get('seasonId')
    
    if (!seasonId) {
      return NextResponse.json({ error: "safra/seasonId is required" }, { status: 400 })
    }

    const metrics = await PlantingDashboardService.getOverviewMetrics(seasonId)
    return NextResponse.json(metrics)
  } catch (error: unknown) {
    console.error("Error fetching dashboard metrics:", error)
    const message = error instanceof Error ? error.message : "Failed to fetch dashboard metrics"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
