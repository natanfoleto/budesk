import { NextRequest, NextResponse } from "next/server"

import { createAuditLog } from "@/lib/audit"
import prisma from "@/lib/prisma"

const AUDIT_Update = "UPDATE"
const AUDIT_Delete = "DELETE"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; recordId: string }> }
) {
  const userId = request.headers.get("x-user-id")
  if (!userId) {
    return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 })
  }
  const { recordId } = await params

  try {
    const body = await request.json()
    const { 
      date, entryTime, exitTime, absent, justification, manualWorkedHours, manualOvertime 
    } = body

    const existingRecord = await prisma.timeRecord.findUnique({
      where: { id: recordId }
    })

    if (!existingRecord) {
      return NextResponse.json({ error: "Registro não encontrado" }, { status: 404 })
    }

    const record = await prisma.timeRecord.update({
      where: { id: recordId },
      data: {
        date: new Date(date),
        entryTime: new Date(entryTime),
        exitTime: exitTime ? new Date(exitTime) : null,
        absent: absent !== undefined ? absent : false,
        justification,
        workedHours: manualWorkedHours ? manualWorkedHours : null,
        overtimeHours: manualOvertime ? manualOvertime : null,
      }
    })

    // Audit
    await createAuditLog({
      action: AUDIT_Update,
      entity: "TimeRecord",
      entityId: record.id,
      oldData: existingRecord,
      newData: record as any,
      userId: userId,
    })

    return NextResponse.json(record)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao atualizar registro de ponto" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; recordId: string }> }
) {
  const userId = request.headers.get("x-user-id")
  if (!userId) {
    return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 })
  }
  const { recordId } = await params
  
  try {
    const existingRecord = await prisma.timeRecord.findUnique({
      where: { id: recordId }
    })

    if (!existingRecord) {
      return NextResponse.json({ error: "Registro não encontrado" }, { status: 404 })
    }

    await prisma.timeRecord.delete({
      where: { id: recordId }
    })
  
    // Audit
    await createAuditLog({
      action: AUDIT_Delete,
      entity: "TimeRecord",
      entityId: recordId,
      oldData: existingRecord,
      userId: userId,
    })
  
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao excluir registro de ponto" }, { status: 500 })
  }
}
