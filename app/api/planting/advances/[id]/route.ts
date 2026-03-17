import { NextRequest, NextResponse } from "next/server"

import { PlantingAdvanceService } from "@/src/modules/planting/services/PlantingAdvanceService"

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const data = await req.json()
    const advance = await PlantingAdvanceService.createOrUpdate({ ...data, id })
    return NextResponse.json(advance)
  } catch (error: unknown) {
    console.error("Error updating planting advance:", error)
    const message = error instanceof Error ? error.message : "Failed to update advance"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    await PlantingAdvanceService.delete(id)
    return NextResponse.json({ message: "Advance deleted successfully" })
  } catch (error: unknown) {
    console.error("Error deleting planting advance:", error)
    const message = error instanceof Error ? error.message : "Failed to delete advance"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
