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
    const {
      vestingPeriodStart,
      vestingPeriodEnd,
      entitledDays,
      usedDays,
      startDate,
      endDate,
      vacationAmountInCents,
      status,
    } = body

    const existing = await prisma.vacation.findUnique({
      where: { id },
    })

    if (!existing) return NextResponse.json({ error: "Férias não encontradas" }, { status: 404 })

    let oneThirdBonusInCents: number | null = existing.oneThirdBonusInCents
    if (vacationAmountInCents !== undefined) {
      oneThirdBonusInCents = vacationAmountInCents ? Math.round(Number(vacationAmountInCents) / 3) : null
    }

    const start = startDate ? new Date(startDate) : existing.startDate
    
    // Automatically generate RHPayment + Transaction if moved to "PAGA" and vacationAmountInCents is set
    if (status === "PAGA" && existing.status !== "PAGA" && vacationAmountInCents) {
      const vacation = await prisma.$transaction(async (tx) => {
        const updated = await tx.vacation.update({
          where: { id },
          data: {
            vestingPeriodStart: vestingPeriodStart ? new Date(vestingPeriodStart) : undefined,
            vestingPeriodEnd: vestingPeriodEnd ? new Date(vestingPeriodEnd) : undefined,
            entitledDays: entitledDays !== undefined ? Number(entitledDays) : undefined,
            usedDays: usedDays !== undefined ? Number(usedDays) : undefined,
            startDate: start,
            endDate: endDate ? new Date(endDate) : undefined,
            vacationAmountInCents: Number(vacationAmountInCents),
            oneThirdBonusInCents,
            status: "PAGA",
          },
          include: { employee: { select: { id: true, name: true } } },
        })

        const netTotalInCents = Number(vacationAmountInCents) + Number(oneThirdBonusInCents)
        const compDate = start || new Date()
        const competenceMonth = `${compDate.getFullYear()}-${String(compDate.getMonth() + 1).padStart(2, "0")}`

        // Create the abstract RHPayment
        const rhPayment = await tx.rHPayment.create({
          data: {
            employeeId: updated.employeeId,
            competenceMonth,
            paymentType: "FERIAS",
            baseSalaryInCents: Number(vacationAmountInCents),
            additionsInCents: Number(oneThirdBonusInCents),
            grossTotalInCents: netTotalInCents,
            netTotalInCents: netTotalInCents,
            status: "PAGO",
            paymentDate: new Date(),
            notes: `Férias pagas referente ao período ${updated.vestingPeriodStart.getFullYear()}/${updated.vestingPeriodEnd.getFullYear()}`
          }
        })

        // Create the actual cash outflow
        await tx.financialTransaction.create({
          data: {
            description: `Pagamento de Férias - ${updated.employee.name} - ${competenceMonth}`,
            type: "SAIDA",
            valueInCents: netTotalInCents,
            category: ExpenseCategory.SALARIO,
            paymentMethod: "TRANSFERENCIA", 
            date: new Date(),
            employeeId: updated.employeeId,
            rhPaymentId: rhPayment.id,
          },
        })

        return updated
      })

      await createAuditLog({
        action: "UPDATE",
        entity: "Vacation",
        entityId: id,
        oldData: existing,
        newData: vacation,
        userId,
      })

      return NextResponse.json(vacation)
    }

    // Normal Update without auto-payment generation
    const vacation = await prisma.vacation.update({
      where: { id },
      data: {
        vestingPeriodStart: vestingPeriodStart ? new Date(vestingPeriodStart) : undefined,
        vestingPeriodEnd: vestingPeriodEnd ? new Date(vestingPeriodEnd) : undefined,
        entitledDays: entitledDays !== undefined ? Number(entitledDays) : undefined,
        usedDays: usedDays !== undefined ? Number(usedDays) : undefined,
        startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : undefined,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined,
        vacationAmountInCents: vacationAmountInCents !== undefined ? (vacationAmountInCents ? Number(vacationAmountInCents) : null) : undefined,
        oneThirdBonusInCents,
        status,
      },
    })

    await createAuditLog({
      action: "UPDATE",
      entity: "Vacation",
      entityId: id,
      oldData: existing,
      newData: vacation,
      userId,
    })

    return NextResponse.json(vacation)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao atualizar férias" }, { status: 500 })
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
    const existing = await prisma.vacation.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Férias não encontradas" }, { status: 404 })

    await prisma.vacation.delete({ where: { id } })

    await createAuditLog({
      action: "DELETE",
      entity: "Vacation",
      entityId: id,
      oldData: existing,
      userId,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao excluir férias" }, { status: 500 })
  }
}
