import { NextRequest, NextResponse } from "next/server"

import prisma from "@/lib/prisma"
import { AuditService } from "@/src/modules/audit/services/AuditService"
import { FinanceService } from "@/src/modules/finance/services/FinanceService"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const advances = await prisma.employeeAdvance.findMany({
      where: { employeeId: id },
      orderBy: { date: "desc" },
      include: { transaction: true }
    })
    return NextResponse.json(advances)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao buscar adiantamentos" }, { status: 500 })
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
    // Support backward compatibility for valueInCents vs amountInCents payload
    const amountInCents = body.amountInCents ?? body.valueInCents
    const { date, note, payrollReference, paymentMethod } = body

    const result = await prisma.$transaction(async (tx) => {
      // Create Advance Record
      const advance = await tx.employeeAdvance.create({
        data: {
          employeeId: id,
          amountInCents,
          date: new Date(date),
          note,
          payrollReference,
        }
      })

      // Create Financial Transaction centrally via Service
      await FinanceService.registerTransaction(tx, {
        type: "SAIDA",
        category: "Adiantamento Salarial",
        amountInCents,
        paymentMethod: paymentMethod || "TRANSFERENCIA",
        description: `Adiantamento Salarial - ${payrollReference || date}`,
        date: new Date(date),
        referenceId: advance.id,
        referenceType: "employeeAdvance",
        userId
      })

      // Audit will be triggered for both individually (FinanceService does its own)
      await AuditService.logAction(tx, "CREATE", "EmployeeAdvance", advance.id, advance, userId)

      return advance
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao criar adiantamento" }, { status: 500 })
  }
}
