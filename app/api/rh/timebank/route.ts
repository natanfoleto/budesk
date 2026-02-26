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
    const { employeeId, horasCredito, horasDebito } = body

    // Calculate current saldo or use defaults
    const record = await prisma.$transaction(async (tx) => {
      const existing = await tx.timeBank.findUnique({ where: { employeeId } })

      if (existing) {
        const novoSaldo = Number(existing.saldoHoras) + Number(horasCredito || 0) - Number(horasDebito || 0)
        return tx.timeBank.update({
          where: { employeeId },
          data: {
            saldoHoras: novoSaldo,
            horasCredito: Number(existing.horasCredito) + Number(horasCredito || 0),
            horasDebito: Number(existing.horasDebito) + Number(horasDebito || 0),
          },
          include: { employee: { select: { name: true } } },
        })
      } else {
        const saldo = Number(horasCredito || 0) - Number(horasDebito || 0)
        return tx.timeBank.create({
          data: {
            employeeId,
            saldoHoras: saldo,
            horasCredito: Number(horasCredito || 0),
            horasDebito: Number(horasDebito || 0),
          },
          include: { employee: { select: { name: true } } },
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
