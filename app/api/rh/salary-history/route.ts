import { NextRequest, NextResponse } from "next/server"

import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const employeeId = searchParams.get("employeeId")

    const where: Record<string, unknown> = {}
    if (employeeId) where.employeeId = employeeId

    const histories = await prisma.salaryHistory.findMany({
      where,
      orderBy: { effectiveDate: "desc" },
      include: {
        employee: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(histories)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao buscar histórico salarial" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get("x-user-id")
  if (!userId) {
    return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { employeeId, previousSalaryInCents, newSalaryInCents, reason, effectiveDate } = body

    const increasePercentage =
      previousSalaryInCents > 0
        ? ((newSalaryInCents - previousSalaryInCents) / previousSalaryInCents) * 100
        : 0

    const history = await prisma.salaryHistory.create({
      data: {
        employeeId,
        previousSalaryInCents,
        newSalaryInCents,
        increasePercentage,
        reason: reason || null,
        effectiveDate: new Date(effectiveDate),
      },
    })

    return NextResponse.json(history, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao criar histórico salarial" }, { status: 500 })
  }
}
