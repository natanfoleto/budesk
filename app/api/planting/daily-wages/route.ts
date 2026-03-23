import { NextResponse } from "next/server"

import { DailyWageService } from "@/src/modules/planting/services/DailyWageService"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const seasonId = searchParams.get('seasonId') || undefined
    const frontId = searchParams.get('frontId') || undefined
    const dateStr = searchParams.get('date')
    const date = dateStr ? new Date(dateStr) : undefined
    
    const tagIds = searchParams.getAll("tagIds").flatMap(t => t.split(",")).filter(Boolean)
    
    const wages = await DailyWageService.list({ 
      seasonId, 
      frontId, 
      date,
      tagIds: tagIds.length > 0 ? tagIds : undefined
    })
    return NextResponse.json(wages)
  } catch (error) {
    console.error("Error fetching daily wages:", error)
    return NextResponse.json({ error: "Failed to fetch daily wages" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const wage = await DailyWageService.createOrUpdate(data)
    return NextResponse.json(wage, { status: 201 })
  } catch (error: unknown) {
    console.error("Error creating daily wage:", error)
    const message = error instanceof Error ? error.message : "Failed to create daily wage"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 })
    
    const deleted = await DailyWageService.delete(id)
    return NextResponse.json(deleted)
  } catch (error: unknown) {
    console.error("Error deleting daily wage:", error)
    const message = error instanceof Error ? error.message : "Failed to delete"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
