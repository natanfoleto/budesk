import { ExpenseCategory } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"

import { createAuditLog } from "@/lib/audit"
import prisma from "@/lib/prisma"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.headers.get("x-user-id")
  if (!userId) return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 })

  try {
    const { id } = await params
    const body = await request.json()
    const { firstInstallmentInCents, secondInstallmentInCents, firstInstallmentPaid, secondInstallmentPaid } = body

    const existing = await prisma.thirteenthSalary.findUnique({
      where: { id },
      include: { employee: true },
    })

    if (!existing) return NextResponse.json({ error: "13º Salário não encontrado" }, { status: 404 })

    // Determine Status
    let status: "PENDENTE" | "PARCIAL" | "PAGO" = "PENDENTE"
    if (firstInstallmentPaid && secondInstallmentPaid) status = "PAGO"
    else if (firstInstallmentPaid || secondInstallmentPaid) status = "PARCIAL"

    const data: {
      status: "PENDENTE" | "PARCIAL" | "PAGO"
      firstInstallmentInCents?: number
      secondInstallmentInCents?: number
      firstInstallmentPaid?: boolean
      secondInstallmentPaid?: boolean
    } = { status }
    
    if (firstInstallmentInCents !== undefined) data.firstInstallmentInCents = Number(firstInstallmentInCents)
    if (secondInstallmentInCents !== undefined) data.secondInstallmentInCents = Number(secondInstallmentInCents)
    if (firstInstallmentPaid !== undefined) data.firstInstallmentPaid = firstInstallmentPaid
    if (secondInstallmentPaid !== undefined) data.secondInstallmentPaid = secondInstallmentPaid

    // Payment Logic
    const thirteenth = await prisma.$transaction(async (tx) => {
      const updated = await tx.thirteenthSalary.update({
        where: { id },
        data,
      })

      const now = new Date()
      const compStr = `${updated.referenceYear}-13`

      // If primeira parcel was JUST marked as paid
      if (firstInstallmentPaid && !existing.firstInstallmentPaid && data.firstInstallmentInCents) {
        
        const rh1 = await tx.rHPayment.create({
          data: {
            employeeId: updated.employeeId,
            competenceMonth: compStr,
            paymentType: "DECIMO_TERCEIRO",
            baseSalaryInCents: Number(data.firstInstallmentInCents),
            grossTotalInCents: Number(data.firstInstallmentInCents),
            netTotalInCents: Number(data.firstInstallmentInCents),
            status: "PAGO",
            paymentDate: now,
            notes: `1ª Parcela do 13º Salário (${updated.referenceYear})`
          }
        })

        await tx.financialTransaction.create({
          data: {
            description: `1ª Parcela 13º - ${existing.employee.name} - ${updated.referenceYear}`,
            type: "SAIDA",
            valueInCents: Math.round(Number(data.firstInstallmentInCents)),
            category: ExpenseCategory.SALARIO,
            paymentMethod: "TRANSFERENCIA",
            date: now,
            employeeId: updated.employeeId,
            rhPaymentId: rh1.id,
          },
        })
      }

      // If segunda parcel was JUST marked as paid
      if (secondInstallmentPaid && !existing.secondInstallmentPaid && data.secondInstallmentInCents) {
        const rh2 = await tx.rHPayment.create({
          data: {
            employeeId: updated.employeeId,
            competenceMonth: compStr,
            paymentType: "DECIMO_TERCEIRO",
            baseSalaryInCents: Number(data.secondInstallmentInCents),
            grossTotalInCents: Number(data.secondInstallmentInCents),
            netTotalInCents: Number(data.secondInstallmentInCents),
            status: "PAGO",
            paymentDate: now,
            notes: `2ª Parcela do 13º Salário (${updated.referenceYear})`
          }
        })

        await tx.financialTransaction.create({
          data: {
            description: `2ª Parcela 13º - ${existing.employee.name} - ${updated.referenceYear}`,
            type: "SAIDA",
            valueInCents: Math.round(Number(data.secondInstallmentInCents)),
            category: ExpenseCategory.SALARIO,
            paymentMethod: "TRANSFERENCIA",
            date: now,
            employeeId: updated.employeeId,
            rhPaymentId: rh2.id,
          },
        })
      }

      return updated
    })

    await createAuditLog({
      action: "UPDATE",
      entity: "ThirteenthSalary",
      entityId: id,
      oldData: existing,
      newData: thirteenth,
      userId,
    })

    return NextResponse.json(thirteenth)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao atualizar 13º salário" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.headers.get("x-user-id")
  if (!userId) return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 })

  try {
    const { id } = await params
    const existing = await prisma.thirteenthSalary.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "13º Salário não encontrado" }, { status: 404 })

    await prisma.thirteenthSalary.delete({ where: { id } })

    await createAuditLog({
      action: "DELETE",
      entity: "ThirteenthSalary",
      entityId: id,
      oldData: existing,
      userId,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao excluir 13º salário" }, { status: 500 })
  }
}
