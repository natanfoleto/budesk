import { NextRequest, NextResponse } from "next/server"

import { createAuditLog } from "@/lib/audit"
import prisma from "@/lib/prisma"
import { EmployeeAccountFormData } from "@/types/employee"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, accountId: string }> }
) {
  const userId = request.headers.get("x-user-id")
  if (!userId) {
    return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 })
  }

  const { id: employeeId, accountId } = await params
  try {
    const body: Partial<EmployeeAccountFormData> = await request.json()
    const oldData = await prisma.employeeAccount.findUnique({ where: { id: accountId } })

    if (!oldData) {
      return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 })
    }

    if (body.isDefault && !oldData.isDefault) {
      // Set others to non-default
      await prisma.employeeAccount.updateMany({
        where: { employeeId },
        data: { isDefault: false }
      })
    }

    const account = await prisma.employeeAccount.update({
      where: { id: accountId },
      data: {
        type: body.type,
        identifier: body.identifier,
        description: body.description,
        isDefault: body.isDefault
      }
    })

    await createAuditLog({
      action: "UPDATE",
      entity: "EmployeeAccount",
      entityId: account.id,
      oldData,
      newData: account,
      userId
    })

    return NextResponse.json(account)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao atualizar conta" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, accountId: string }> }
) {
  const userId = request.headers.get("x-user-id")
  if (!userId) {
    return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 })
  }

  const { accountId } = await params
  try {
    const oldData = await prisma.employeeAccount.findUnique({ where: { id: accountId } })
    if (!oldData) {
      return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 })
    }

    await prisma.employeeAccount.delete({ where: { id: accountId } })

    await createAuditLog({
      action: "DELETE",
      entity: "EmployeeAccount",
      entityId: accountId,
      oldData,
      userId
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao excluir conta" }, { status: 500 })
  }
}
