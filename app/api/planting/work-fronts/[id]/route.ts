import { NextResponse } from "next/server"

import { WorkFrontService } from "@/src/modules/planting/services/WorkFrontService"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const front = await WorkFrontService.getById(id)
    if (!front) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(front)
  } catch (error) {
    console.error("Error fetching work front:", error)
    return NextResponse.json({ error: "Failed to fetch work front" }, { status: 500 })
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

    const front = await WorkFrontService.update(id, data, userId)
    return NextResponse.json(front)
  } catch (error) {
    console.error("Error updating work front:", error)
    return NextResponse.json({ error: "Failed to update work front" }, { status: 500 })
  }
}
