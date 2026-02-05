import { NextRequest, NextResponse } from "next/server"

import { createAuditLog } from "@/lib/audit"
import prisma from "@/lib/prisma"

const AUDIT_Create = "CREATE"

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
    const { valueInCents, date, note, payrollReference, paymentMethod } = body

    // Transaction Data
    const transactionData = {
      description: `Adiantamento Salarial - ${payrollReference || date}`,
      type: "SAIDA" as const,
      valueInCents: valueInCents,
      category: "Adiantamento Salarial",
      paymentMethod: paymentMethod || "TRANSFERENCIA",
      date: new Date(date),
      employeeId: id,
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Financial Transaction
      const transaction = await tx.financialTransaction.create({
        data: transactionData
      })

      // 2. Create Advance Record (amount is Decimal, so divide by 100)
      const advance = await tx.employeeAdvance.create({
        data: {
          employeeId: id,
          amount: valueInCents / 100.0,
          date: new Date(date),
          note,
          payrollReference,
          transactionId: transaction.id
        }
      })

      return { advance, transaction }
    })

    // Audit
    await createAuditLog({
      action: AUDIT_Create,
      entity: "EmployeeAdvance",
      entityId: result.advance.id,
      newData: result as any, // Using 'as any' to match the loosely typed helper expectation or ensure compatibility
      userId: userId,
    })

    return NextResponse.json(result.advance, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao criar adiantamento" }, { status: 500 })
  }
}
