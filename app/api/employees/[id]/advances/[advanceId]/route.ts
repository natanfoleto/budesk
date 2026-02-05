import { NextRequest, NextResponse } from "next/server"

import { createAuditLog } from "@/lib/audit"
import prisma from "@/lib/prisma"

const AUDIT_Update = "UPDATE"
const AUDIT_Delete = "DELETE"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; advanceId: string }> }
) {
  const userId = request.headers.get("x-user-id")
  if (!userId) {
    return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 })
  }
  const { advanceId } = await params

  try {
    const body = await request.json()
    const { valueInCents, date, note, payrollReference, paymentMethod } = body

    const result = await prisma.$transaction(async (tx) => {
      // 1. Get existing advance
      const existingAdvance = await tx.employeeAdvance.findUnique({
        where: { id: advanceId },
        include: { transaction: true }
      })

      if (!existingAdvance) throw new Error("Advance not found")

      // 2. Update Transaction if exists
      const transactionId = existingAdvance.transactionId
      if (transactionId) {
        await tx.financialTransaction.update({
          where: { id: transactionId },
          data: {
            valueInCents: valueInCents,
            date: new Date(date),
            paymentMethod: paymentMethod || "TRANSFERENCIA",
            description: `Adiantamento Salarial - ${payrollReference || date}`,
          }
        })
      }

      // 3. Update Advance
      const advance = await tx.employeeAdvance.update({
        where: { id: advanceId },
        data: {
          amount: valueInCents / 100.0,
          date: new Date(date),
          note,
          payrollReference,
        }
      })

      return { advance, existingAdvance }
    })

    // Audit
    await createAuditLog({
      action: AUDIT_Update,
      entity: "EmployeeAdvance",
      entityId: advanceId,
      oldData: result.existingAdvance,
      newData: result.advance as any,
      userId: userId,
    })

    return NextResponse.json(result.advance)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao atualizar adiantamento" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; advanceId: string }> }
) {
  const userId = request.headers.get("x-user-id")
  if (!userId) {
    return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 })
  }
  const { advanceId } = await params
  
  try {
    const result = await prisma.$transaction(async (tx) => {
      const advance = await tx.employeeAdvance.findUnique({
        where: { id: advanceId }
      })
          
      if (!advance) throw new Error("Advance not found")

      // Delete advance first (foreign key dependency might exist, but usually Transaction is independent... 
      // Wait, Advance has transactionId (optional) -> Transaction.
      // Relation: Transaction has NO foreign key to Advance (Advance holds the FK).
      // So we must delete Advance first, then Transaction? 
      // Actually, if we delete creation, we delete both.
          
      await tx.employeeAdvance.delete({
        where: { id: advanceId }
      })

      if (advance.transactionId) {
        await tx.financialTransaction.delete({
          where: { id: advance.transactionId }
        })
      }

      return advance
    })
  
    // Audit
    await createAuditLog({
      action: AUDIT_Delete,
      entity: "EmployeeAdvance",
      entityId: advanceId,
      oldData: result,
      userId: userId,
    })
  
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao excluir adiantamento" }, { status: 500 })
  }
}
