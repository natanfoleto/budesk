import { NextRequest, NextResponse } from "next/server"

import prisma from "@/lib/prisma"

const AUDIT_UPDATE = "UPDATE"
const AUDIT_DELETE = "DELETE"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const userId = request.headers.get("x-user-id")

  try {
    const body = await request.json()
    const { description, amount, dueDate, status, supplierId } = body

    const oldData = await prisma.accountPayable.findUnique({ where: { id } })

    if (!oldData) {
      return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 })
    }

    const account = await prisma.accountPayable.update({
      where: { id },
      data: {
        description,
        amount,
        dueDate: new Date(dueDate),
        status,
        supplierId: supplierId || null,
      },
    })

    await prisma.auditLog.create({
      data: {
        action: AUDIT_UPDATE,
        entity: "AccountPayable",
        entityId: account.id,
        oldData: oldData as any,
        newData: account as any,
        userId: userId,
      }
    })

    return NextResponse.json(account)
  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar conta" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const userId = request.headers.get("x-user-id")

  try {
    const oldData = await prisma.accountPayable.findUnique({ where: { id } })

    if (!oldData) {
      return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 })
    }

    await prisma.accountPayable.delete({
      where: { id },
    })

    await prisma.auditLog.create({
      data: {
        action: AUDIT_DELETE,
        entity: "AccountPayable",
        entityId: id,
        oldData: oldData as any,
        userId: userId,
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Erro ao excluir conta" }, { status: 500 })
  }
}
