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
      admissionDate, terminationDate, jobTitle, baseSalary,
      contractType, weeklyWorkload, workRegime, isActive, notes,
      hasMedicalExam, hasSignedRegistration, hasSignedEpiReceipt
    } = body

    const existingRecord = await prisma.employmentRecord.findUnique({
      where: { id: recordId }
    })

    const record = await prisma.employmentRecord.update({
      where: { id: recordId },
      data: {
        admissionDate: new Date(admissionDate),
        terminationDate: terminationDate ? new Date(terminationDate) : null,
        jobTitle,
        baseSalary,
        contractType,
        weeklyWorkload: weeklyWorkload ? parseInt(weeklyWorkload) : null,
        workRegime,
        isActive: isActive !== undefined ? isActive : true,
        hasMedicalExam,
        hasSignedRegistration,
        hasSignedEpiReceipt,
        notes
      }
    })

    // Audit
    await createAuditLog({
      action: AUDIT_Update,
      entity: "EmploymentRecord",
      entityId: record.id,
      oldData: existingRecord,
      newData: record as any,
      userId: userId,
    })

    return NextResponse.json(record)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao atualizar registro" }, { status: 500 })
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
    const existingRecord = await prisma.employmentRecord.findUnique({
      where: { id: recordId }
    })

    await prisma.employmentRecord.delete({
      where: { id: recordId }
    })
  
    // Audit
    await createAuditLog({
      action: AUDIT_Delete,
      entity: "EmploymentRecord",
      entityId: recordId,
      oldData: existingRecord,
      userId: userId,
    })
  
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao excluir registro" }, { status: 500 })
  }
}
