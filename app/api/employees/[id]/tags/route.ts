import { NextRequest, NextResponse } from "next/server"

import { createAuditLog } from "@/lib/audit"
import { EmployeeTagService } from "@/src/modules/employees/services/EmployeeTagService"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const tags = await EmployeeTagService.getEmployeeTags(id)
    return NextResponse.json(tags)
  } catch (error) {
    console.error("Error fetching employee tags:", error)
    return NextResponse.json({ error: "Erro ao buscar etiquetas do funcionário" }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = req.headers.get("x-user-id")
  if (!userId) {
    return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await req.json()
    const { tagIds } = body

    if (!Array.isArray(tagIds)) {
      return NextResponse.json({ error: "tagIds deve ser um array" }, { status: 400 })
    }

    const tags = await EmployeeTagService.syncEmployeeTags(id, tagIds)

    await createAuditLog({
      action: "UPDATE",
      entity: "Employee",
      entityId: id,
      newData: { tags: tagIds },
      userId: userId,
    })

    return NextResponse.json(tags)
  } catch (error: unknown) {
    console.error("Error syncing employee tags:", error)
    const message = error instanceof Error ? error.message : "Erro ao atualizar etiquetas do funcionário"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
