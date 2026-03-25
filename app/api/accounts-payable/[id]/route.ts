import { NextRequest, NextResponse } from "next/server"

import prisma from "@/lib/prisma"
import { AuditService } from "@/src/modules/audit/services/AuditService"

const AUDIT_UPDATE = "UPDATE"
const AUDIT_DELETE = "DELETE"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const account = await prisma.accountPayable.findUnique({
      where: { id },
      include: {
        supplier: true,
        installments: {
          orderBy: { installmentNumber: "asc" }
        }
      }
    })

    if (!account) {
      return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 })
    }

    return NextResponse.json(account)
  } catch {
    return NextResponse.json({ error: "Erro ao buscar conta" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const userId = request.headers.get("x-user-id")

  try {
    const body = await request.json()
    const { description, supplierId, costCenterId, paymentMethod } = body

    const oldData = await prisma.accountPayable.findUnique({ 
      where: { id },
      include: { installments: true }
    })

    if (!oldData) {
      return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 })
    }

    const account = await prisma.accountPayable.update({
      where: { id },
      data: {
        description,
        supplierId: supplierId || null,
        costCenterId: costCenterId || null,
        paymentMethod,
      },
      include: { installments: true }
    })

    await AuditService.logAction(prisma, AUDIT_UPDATE, "AccountPayable", account.id, account, userId || null, oldData)

    return NextResponse.json(account)
  } catch (error) {
    console.error(error)
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

    await AuditService.logAction(prisma, AUDIT_DELETE, "AccountPayable", id, oldData, userId || null)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao excluir conta" }, { status: 500 })
  }
}
