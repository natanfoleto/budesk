import { NextRequest, NextResponse } from "next/server"

import prisma from "@/lib/prisma"
import { AuditService } from "@/src/modules/audit/services/AuditService"

const AUDIT_DELETE = "DELETE"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ installmentId: string; id: string }> }
) {
  const { id } = await params
  const userId = request.headers.get("x-user-id")

  try {
    const attachment = await prisma.accountInstallmentAttachment.findUnique({
      where: { id },
      include: {
        installment: {
          include: {
            account: true
          }
        }
      }
    })

    if (!attachment) {
      return NextResponse.json({ error: "Anexo não encontrado" }, { status: 404 })
    }

    await prisma.accountInstallmentAttachment.delete({
      where: { id },
    })

    await AuditService.logAction(
      prisma, 
      AUDIT_DELETE, 
      "AccountInstallmentAttachment", 
      id, 
      attachment, 
      userId || null
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao excluir anexo" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ installmentId: string; id: string }> }
) {
  const { id } = await params
  const { type } = await request.json()
  const userId = request.headers.get("x-user-id")

  try {
    const oldAttachment = await prisma.accountInstallmentAttachment.findUnique({
      where: { id },
    })

    if (!oldAttachment) {
      return NextResponse.json({ error: "Anexo não encontrado" }, { status: 404 })
    }

    const attachment = await prisma.accountInstallmentAttachment.update({
      where: { id },
      data: { type },
    })

    await AuditService.logAction(
      prisma, 
      "UPDATE", 
      "AccountInstallmentAttachment", 
      id, 
      { from: oldAttachment.type, to: type }, 
      userId || null
    )

    return NextResponse.json(attachment)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao atualizar anexo" }, { status: 500 })
  }
}
