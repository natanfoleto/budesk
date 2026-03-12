import { NextResponse } from "next/server"

import { DriverAllocationService } from "@/src/modules/planting/services/DriverAllocationService"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const seasonId = searchParams.get('seasonId') || undefined
    const frontId = searchParams.get('frontId') || undefined
    const dateStr = searchParams.get('date')
    const date = dateStr ? new Date(dateStr) : undefined
    
    const allocations = await DriverAllocationService.list({ seasonId, frontId, date })
    return NextResponse.json(allocations)
  } catch (error) {
    console.error("Error fetching allocations:", error)
    return NextResponse.json({ error: "Failed to fetch allocations" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const allocation = await DriverAllocationService.createOrUpdate(data)
    return NextResponse.json(allocation, { status: 201 })
  } catch (error: unknown) {
    console.error("Error creating allocation:", error)
    const message = error instanceof Error ? error.message : "Failed to create allocation"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 })
    
    const deleted = await DriverAllocationService.delete(id)
    return NextResponse.json(deleted)
  } catch (error: unknown) {
    console.error("Error deleting allocation:", error)
    const message = error instanceof Error ? error.message : "Failed to delete"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
