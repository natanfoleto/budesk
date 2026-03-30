import { AttachmentType } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"

import prisma from "@/lib/prisma"
import { AuditService } from "@/src/modules/audit/services/AuditService"

const AUDIT_UPDATE = "UPDATE"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ installmentId: string }> }
) {
  const { installmentId } = await params
  const userId = request.headers.get("x-user-id")

  try {
    const body = await request.json()
    const { type, fileName, fileUrl } = body

    if (!fileUrl || !type) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
    }

    const attachment = await prisma.accountInstallmentAttachment.create({
      data: {
        installmentId,
        type: type as AttachmentType,
        fileName: fileName || fileUrl.split("/").pop() || "arquivo",
        fileUrl,
      },
      include: {
        installment: {
          include: {
            account: true
          }
        }
      }
    })

    await AuditService.logAction(
      prisma, 
      AUDIT_UPDATE, 
      "AccountInstallment", 
      installmentId, 
      attachment, 
      userId || null
    )

    return NextResponse.json(attachment, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao adicionar anexo" }, { status: 500 })
  }
}
