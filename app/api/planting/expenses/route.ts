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

    const cleanData = { ...data }
    delete cleanData.itemDescription
    delete cleanData.invoiceNumber
    
    if (data.invoiceNumber) {
      cleanData.description = `${data.description} (NF: ${data.invoiceNumber})`
    }

    const expense = await PlantingExpenseService.create(cleanData, userId)
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

export async function PUT(req: Request) {
  try {
    const data = await req.json()
    const userId = req.headers.get("x-user-id")
    
    if (!userId) {
      return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 })
    }

    const { id, ...cleanData } = data
    delete cleanData.itemDescription
    delete cleanData.invoiceNumber
    
    if (!id) return NextResponse.json({ error: "ID obrigatório para edição" }, { status: 400 })

    if (data.invoiceNumber) {
      cleanData.description = `${data.description} (NF: ${data.invoiceNumber})`
    }

    const expense = await PlantingExpenseService.update(id, cleanData, userId)
    return NextResponse.json(expense)
  } catch (error: unknown) {
    console.error("Error updating expense:", error)
    const message = error instanceof Error ? error.message : "Failed to update expense"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
