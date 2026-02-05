import { NextRequest, NextResponse } from "next/server"

import { createAuditLog } from "@/lib/audit"
import prisma from "@/lib/prisma"

const AUDIT_Update = "UPDATE"
const AUDIT_Delete = "DELETE"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contractId: string }> }
) {
  const userId = request.headers.get("x-user-id")
  if (!userId) {
    return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 })
  }
  const { contractId } = await params

  try {
    const body = await request.json()
    const { 
      type, startDate, endDate, valueInCents, status, description, fileUrl
    } = body

    const existingContract = await prisma.employeeContract.findUnique({
      where: { id: contractId }
    })

    if (!existingContract) {
      return NextResponse.json({ error: "Contrato não encontrado" }, { status: 404 })
    }

    const contract = await prisma.employeeContract.update({
      where: { id: contractId },
      data: {
        type,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        valueInCents: parseInt(valueInCents),
        status,
        description,
        fileUrl
      }
    })

    // Audit
    await createAuditLog({
      action: AUDIT_Update,
      entity: "EmployeeContract",
      entityId: contract.id,
      oldData: existingContract,
      newData: contract as any,
      userId: userId,
    })

    return NextResponse.json(contract)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao atualizar contrato" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contractId: string }> }
) {
  const userId = request.headers.get("x-user-id")
  if (!userId) {
    return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 })
  }
  const { contractId } = await params
  
  try {
    const existingContract = await prisma.employeeContract.findUnique({
      where: { id: contractId }
    })

    if (!existingContract) {
      return NextResponse.json({ error: "Contrato não encontrado" }, { status: 404 })
    }

    await prisma.employeeContract.delete({
      where: { id: contractId }
    })
  
    // Audit
    await createAuditLog({
      action: AUDIT_Delete,
      entity: "EmployeeContract",
      entityId: contractId,
      oldData: existingContract,
      userId: userId,
    })
  
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao excluir contrato" }, { status: 500 })
  }
}
