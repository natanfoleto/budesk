import { NextRequest, NextResponse } from "next/server"

import { createAuditLog } from "@/lib/audit"
import prisma from "@/lib/prisma"

const AUDIT_Update = "UPDATE"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const records = await prisma.employmentRecord.findMany({
      where: { employeeId: id },
      orderBy: { createdAt: "desc" }
    })
    return NextResponse.json(records)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao buscar registros" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.headers.get("x-user-id")
  if (!userId) {
    return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 })
  }
  const { id } = await params

  try {
    const body = await request.json()
    const { 
      admissionDate, terminationDate, jobTitle, baseSalary,
      contractType, weeklyWorkload, workRegime, isActive, notes,
      hasMedicalExam, hasSignedRegistration, hasSignedEpiReceipt
    } = body

    const record = await prisma.employmentRecord.create({
      data: {
        employeeId: id,
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
      newData: record as any,
      userId: userId,
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao criar registro" }, { status: 500 })
  }
}
