import { NextRequest, NextResponse } from "next/server"

import { createAuditLog } from "@/lib/audit"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const employeeId = searchParams.get("employeeId")

    const where: Record<string, unknown> = {}
    if (employeeId) where.employeeId = employeeId

    const timeBanks = await prisma.timeBank.findMany({
      where,
      include: {
        employee: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(timeBanks)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao buscar banco de horas" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get("x-user-id")
  if (!userId) return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 })

  try {
    const body = await request.json()
    const { employeeId, creditHours, debitHours } = body

    // Calculate current saldo or use defaults
    const record = await prisma.$transaction(async (tx) => {
      const existing = await tx.timeBank.findUnique({ where: { employeeId } })

      if (existing) {
        const newBalance = Number(existing.balanceHours) + Number(creditHours || 0) - Number(debitHours || 0)
        return tx.timeBank.update({
          where: { employeeId },
          data: {
            balanceHours: newBalance,
            creditHours: Number(existing.creditHours) + Number(creditHours || 0),
            debitHours: Number(existing.debitHours) + Number(debitHours || 0),
          },
          include: { employee: { select: { id: true, name: true } } },
        })
      } else {
        const balance = Number(creditHours || 0) - Number(debitHours || 0)
        return tx.timeBank.create({
          data: {
            employeeId,
            balanceHours: balance,
            creditHours: Number(creditHours || 0),
            debitHours: Number(debitHours || 0),
          },
          include: { employee: { select: { id: true, name: true } } },
        })
      }
    })

    await createAuditLog({
      action: "UPDATE",
      entity: "TimeBank",
      entityId: record.id,
      newData: record,
      userId,
    })

    return NextResponse.json(record)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao atualizar banco de horas" }, { status: 500 })
  }
}
