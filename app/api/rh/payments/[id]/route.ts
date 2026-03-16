import { ExpenseCategory, PaymentMethod } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"

import { createAuditLog } from "@/lib/audit"
import prisma from "@/lib/prisma"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const payment = await prisma.rHPayment.findUnique({
      where: { id },
      include: {
        employee: { select: { id: true, name: true, role: true } },
        taxes: true,
        allocations: true,
        transaction: true,
      },
    })

    if (!payment) {
      return NextResponse.json({ error: "Pagamento não encontrado" }, { status: 404 })
    }

    return NextResponse.json(payment)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao buscar pagamento" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.headers.get("x-user-id")
  if (!userId) {
    return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const {
      competenceMonth,
      paymentType,
      baseSalaryInCents,
      additionsInCents = 0,
      overtimeHours = 0,
      overtimeValueInCents = 0,
      discountsInCents = 0,
      advancesValueInCents = 0,
      status,
      paymentDate,
      paymentMethod,
      costCenterId,
      notes,
    } = body

    const existing = await prisma.rHPayment.findUnique({
      where: { id },
      include: { transaction: true },
    })

    if (!existing) {
      return NextResponse.json({ error: "Pagamento não encontrado" }, { status: 404 })
    }

    const grossTotalInCents = Number(baseSalaryInCents ?? existing.baseSalaryInCents) + Number(additionsInCents ?? existing.additionsInCents) + Number(overtimeValueInCents ?? existing.overtimeValueInCents)
    const netTotalInCents = grossTotalInCents - Number(discountsInCents ?? existing.discountsInCents) - Number(advancesValueInCents ?? existing.advancesValueInCents)

    const mergedData = {
      competenceMonth: competenceMonth ?? existing.competenceMonth,
      paymentType: paymentType ?? existing.paymentType,
      baseSalaryInCents: baseSalaryInCents ?? existing.baseSalaryInCents,
      additionsInCents: additionsInCents ?? existing.additionsInCents,
      overtimeHours: overtimeHours ?? existing.overtimeHours,
      overtimeValueInCents: overtimeValueInCents ?? existing.overtimeValueInCents,
      discountsInCents: discountsInCents ?? existing.discountsInCents,
      advancesValueInCents: advancesValueInCents ?? existing.advancesValueInCents,
      grossTotalInCents,
      netTotalInCents,
    }

    // If changing to PAGO status and no transaction exists yet → create one
    if (status === "PAGO" && existing.status !== "PAGO" && !existing.transaction) {
      const payment = await prisma.$transaction(async (tx) => {
        const updated = await tx.rHPayment.update({
          where: { id },
          data: {
            ...mergedData,
            status: "PAGO",
            paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
            paymentMethod: paymentMethod ?? existing.paymentMethod ?? null,
            costCenterId: costCenterId ?? existing.costCenterId ?? null,
            notes: notes ?? existing.notes ?? null,
          },
          include: {
            employee: { select: { id: true, name: true, role: true } },
          },
        })

        await tx.financialTransaction.create({
          data: {
            description: `Pagamento RH - ${updated.employee.name} - ${mergedData.competenceMonth}`,
            type: "SAIDA",
            valueInCents: netTotalInCents,
            category: ExpenseCategory.SALARIO,
            paymentMethod: (paymentMethod ?? existing.paymentMethod ?? "TRANSFERENCIA") as PaymentMethod,
            date: paymentDate ? new Date(paymentDate) : new Date(),
            employeeId: updated.employeeId,
            rhPaymentId: id,
          },
        })

        return updated
      })

      await createAuditLog({
        action: "UPDATE",
        entity: "RHPayment",
        entityId: id,
        oldData: existing,
        newData: { ...existing, status: "PAGO" },
        userId,
      })

      return NextResponse.json(payment)
    }

    // If changing from PAGO to another status → delete the linked transaction (rollback)
    if (status !== "PAGO" && existing.status === "PAGO" && existing.transaction) {
      const payment = await prisma.$transaction(async (tx) => {
        // Remove the rhPaymentId reference first (unique constraint)
        await tx.financialTransaction.delete({
          where: { id: existing.transaction!.id },
        })

        return tx.rHPayment.update({
          where: { id },
          data: {
            ...mergedData,
            status: status ?? existing.status,
            paymentDate: paymentDate ? new Date(paymentDate) : null,
            paymentMethod: paymentMethod ?? existing.paymentMethod ?? null,
            costCenterId: costCenterId ?? existing.costCenterId ?? null,
            notes: notes ?? existing.notes ?? null,
          },
        })
      })

      return NextResponse.json(payment)
    }

    // Normal update (no status-related financial side effects)
    const payment = await prisma.rHPayment.update({
      where: { id },
      data: {
        ...mergedData,
        status: status ?? existing.status,
        paymentDate: paymentDate ? new Date(paymentDate) : null,
        paymentMethod: paymentMethod ?? existing.paymentMethod ?? null,
        costCenterId: costCenterId ?? existing.costCenterId ?? null,
        notes: notes ?? existing.notes ?? null,
      },
    })

    await createAuditLog({
      action: "UPDATE",
      entity: "RHPayment",
      entityId: id,
      oldData: existing,
      newData: payment,
      userId,
    })

    return NextResponse.json(payment)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao atualizar pagamento" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.headers.get("x-user-id")
  if (!userId) {
    return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 })
  }

  try {
    const { id } = await params
    const existing = await prisma.rHPayment.findUnique({
      where: { id },
      include: { transaction: true, taxes: true },
    })

    if (!existing) {
      return NextResponse.json({ error: "Pagamento não encontrado" }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      // Rollback: delete associated financial transaction if exists
      if (existing.transaction) {
        await tx.financialTransaction.delete({
          where: { id: existing.transaction.id },
        })
      }

      // EmployerContribution and ProjectAllocation cascade on delete
      await tx.rHPayment.delete({ where: { id } })
    })

    await createAuditLog({
      action: "DELETE",
      entity: "RHPayment",
      entityId: id,
      oldData: existing,
      userId,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao excluir pagamento" }, { status: 500 })
  }
}
