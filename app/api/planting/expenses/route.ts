import { NextResponse } from "next/server"

import { PlantingExpenseService } from "@/src/modules/planting/services/PlantingExpenseService"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const seasonId = searchParams.get('seasonId') || undefined
    const frontId = searchParams.get('frontId') || undefined
    const dateStr = searchParams.get('date')
    const date = dateStr ? new Date(dateStr) : undefined
    
    const expenses = await PlantingExpenseService.list({ seasonId, frontId, date })
    return NextResponse.json(expenses)
  } catch (error) {
    console.error("Error fetching expenses:", error)
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const userId = req.headers.get("x-user-id")
    
    if (!userId) {
      return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 })
    }

    const expense = await PlantingExpenseService.create(data, userId)
    return NextResponse.json(expense, { status: 201 })
  } catch (error: unknown) {
    console.error("Error creating expense:", error)
    const message = error instanceof Error ? error.message : "Failed to create expense"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 })
    
    const deleted = await PlantingExpenseService.delete(id)
    return NextResponse.json(deleted)
  } catch (error: unknown) {
    console.error("Error deleting expense:", error)
    const message = error instanceof Error ? error.message : "Failed to delete"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
