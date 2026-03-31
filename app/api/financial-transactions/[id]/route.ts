import { NextRequest, NextResponse } from "next/server"

import { createAuditLog } from "@/lib/audit"
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
    const { description, type, valueInCents, category, paymentMethod, date, supplierId, employeeId, serviceId } = body

    const oldData = await prisma.financialTransaction.findUnique({ where: { id } })

    if (!oldData) {
      return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 })
    }

    const transaction = await prisma.financialTransaction.update({
      where: { id },
      data: {
        description,
        type,
        valueInCents,
        category,
        paymentMethod,
        date: new Date(date),
        supplierId: supplierId || null,
        employeeId: employeeId || null,
        serviceId: serviceId || null,
      },
    })

    await createAuditLog({
      action: AUDIT_UPDATE,
      entity: "FinancialTransaction",
      entityId: transaction.id,
      oldData: oldData,
      newData: transaction,
      userId: userId || "",
    })

    return NextResponse.json(transaction)
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar transação" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const userId = request.headers.get("x-user-id")

  try {
    const oldData = await prisma.financialTransaction.findUnique({ where: { id } })

    if (!oldData) {
      return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 })
    }

    await prisma.financialTransaction.delete({
      where: { id },
    })

    await createAuditLog({
      action: AUDIT_DELETE,
      entity: "FinancialTransaction",
      entityId: id,
      oldData: oldData,
      userId: userId || "",
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Erro ao excluir transação" }, { status: 500 })
  }
}
