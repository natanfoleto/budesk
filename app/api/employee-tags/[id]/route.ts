import { NextRequest, NextResponse } from "next/server"

import { createAuditLog } from "@/lib/audit"
import { EmployeeTagService } from "@/src/modules/employees/services/EmployeeTagService"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = req.headers.get("x-user-id")
  if (!userId) {
    return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await req.json()
    const { name, color, employeeIds } = body

    const tag = await EmployeeTagService.update(id, { name, color, employeeIds })

    await createAuditLog({
      action: "UPDATE",
      entity: "EmployeeTag",
      entityId: id,
      newData: tag,
      userId: userId,
    })

    return NextResponse.json(tag)
  } catch (error: unknown) {
    console.error("Error updating tag:", error)
    const message = error instanceof Error ? error.message : "Erro ao atualizar etiqueta"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = req.headers.get("x-user-id")
  if (!userId) {
    return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 })
  }

  try {
    const { id } = await params
    await EmployeeTagService.delete(id)

    await createAuditLog({
      action: "DELETE",
      entity: "EmployeeTag",
      entityId: id,
      userId: userId,
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error("Error deleting tag:", error)
    const message = error instanceof Error ? error.message : "Erro ao excluir etiqueta"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
