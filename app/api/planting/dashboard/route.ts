import { NextResponse } from "next/server"

import { PlantingDashboardService } from "@/src/modules/planting/services/PlantingDashboardService"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const seasonId = searchParams.get('seasonId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    const mode = searchParams.get('mode') // "overview" (default), "periods", "charts"
    
    if (!seasonId) {
      return NextResponse.json({ error: "safra/seasonId is required" }, { status: 400 })
    }

    if (mode === 'periods') {
      const baseDate = searchParams.get('date') || undefined
      const metrics = await PlantingDashboardService.getPeriodMetrics(seasonId, baseDate)
      return NextResponse.json(metrics)
    }

    if (mode === 'charts') {
      const days = Number(searchParams.get('days') || 30)
      const data = await PlantingDashboardService.getChartData(seasonId, days)
      return NextResponse.json(data)
    }

    const metrics = await PlantingDashboardService.getOverviewMetrics(
      seasonId, 
      startDate || undefined, 
      endDate || undefined
    )
    return NextResponse.json(metrics)
  } catch (error: unknown) {
    console.error("Error fetching dashboard metrics:", error)
    const message = error instanceof Error ? error.message : "Failed to fetch dashboard metrics"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
