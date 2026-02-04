import { NextRequest, NextResponse } from "next/server"
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
    const { amount, date, note, payrollReference, paymentMethod } = body // paymentMethod needed for transaction

    // Transaction Data
    const transactionData = {
      description: `Adiantamento Salarial - ${payrollReference || date}`,
      type: "SAIDA" as const, // Force enum type
      amount: amount,
      category: "Adiantamento Salarial",
      paymentMethod: paymentMethod || "TRANSFERENCIA", // Default
      date: new Date(date),
      employeeId: id, // Link to employee in transaction metadata
    }

    // Use transaction to ensure both create or both fail
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Financial Transaction
      const transaction = await tx.financialTransaction.create({
        data: transactionData
      })

      // 2. Create Advance Record linked to Transaction
      const advance = await tx.employeeAdvance.create({
        data: {
          employeeId: id,
          amount,
          date: new Date(date),
          note,
          payrollReference,
          transactionId: transaction.id
        }
      })

      return { advance, transaction }
    })

     // Audit
     await prisma.auditLog.create({
      data: {
        action: AUDIT_Create,
        entity: "EmployeeAdvance",
        entityId: result.advance.id,
        newData: result as any,
        userId: userId,
      }
    })

    return NextResponse.json(result.advance, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao criar adiantamento" }, { status: 500 })
  }
}
