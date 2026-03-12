import { NextResponse } from "next/server"

import { DriverAllocationService } from "@/src/modules/planting/services/DriverAllocationService"

export async function GET() {
  try {
    const categories = await DriverAllocationService.listCategories()
    return NextResponse.json(categories)
  } catch (error) {
    console.error("Error fetching driver categories:", error)
    return NextResponse.json({ error: "Failed to fetch driver categories" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const category = await DriverAllocationService.createCategory(data)
    return NextResponse.json(category, { status: 201 })
  } catch (error: unknown) {
    console.error("Error creating driver category:", error)
    const message = error instanceof Error ? error.message : "Failed to create driver category"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
