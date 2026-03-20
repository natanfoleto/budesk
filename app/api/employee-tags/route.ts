import { NextRequest, NextResponse } from "next/server"

import { createAuditLog } from "@/lib/audit"
import { EmployeeTagService } from "@/src/modules/employees/services/EmployeeTagService"

export async function GET() {
  try {
    const tags = await EmployeeTagService.list()
    return NextResponse.json(tags)
  } catch (error) {
    console.error("Error fetching tags:", error)
    return NextResponse.json({ error: "Erro ao buscar etiquetas" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id")
  if (!userId) {
    return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, color } = body

    if (!name || !color) {
      return NextResponse.json({ error: "Nome e cor são obrigatórios" }, { status: 400 })
    }

    const tag = await EmployeeTagService.create({ name, color })

    await createAuditLog({
      action: "CREATE",
      entity: "EmployeeTag",
      entityId: tag.id,
      newData: tag,
      userId: userId,
    })

    return NextResponse.json(tag, { status: 201 })
  } catch (error: unknown) {
    console.error("Error creating tag:", error)
    const message = error instanceof Error ? error.message : "Erro ao criar etiqueta"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
