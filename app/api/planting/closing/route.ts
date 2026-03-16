import { NextRequest, NextResponse } from "next/server"

import prisma from "@/lib/prisma"
import { PlantingClosingService } from "@/src/modules/planting/services/PlantingClosingService"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const seasonId = searchParams.get("seasonId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    if (!seasonId || !startDate || !endDate) {
      return NextResponse.json({ error: "seasonId, startDate and endDate are required" }, { status: 400 })
    }

    // Always use explicit UTC boundaries from the date-only portion to avoid timezone drift
    const startOnly = startDate.split("T")[0]
    const endOnly = endDate.split("T")[0]
    const start = new Date(`${startOnly}T00:00:00.000Z`)
    const end = new Date(`${endOnly}T23:59:59.999Z`)

    const closedRecord = await prisma.plantingProduction.findFirst({
      where: { seasonId, date: { gte: start, lte: end }, isClosed: true },
    })

    return NextResponse.json({ isClosed: !!closedRecord })
  } catch (error: unknown) {
    console.error("Error checking period status:", error)
    return NextResponse.json({ error: "Failed to check period status" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { seasonId, startDate, endDate } = await req.json()
    if (!seasonId || !startDate || !endDate) {
      return NextResponse.json({ error: "seasonId, startDate and endDate are required" }, { status: 400 })
    }

    // Always use explicit UTC boundaries from the date-only portion to avoid timezone drift
    const startOnly = startDate.split("T")[0]
    const endOnly = endDate.split("T")[0]
    const start = new Date(`${startOnly}T00:00:00.000Z`)
    const end = new Date(`${endOnly}T23:59:59.999Z`)

    const result = await PlantingClosingService.closePeriod(seasonId, start, end)

    return NextResponse.json({ message: "Fechamento realizado com sucesso", result })
  } catch (error: unknown) {
    console.error("Error during closing:", error)
    const message = error instanceof Error ? error.message : "Failed to close period"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
