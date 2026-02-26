import { NextRequest, NextResponse } from "next/server"

import { createAuditLog } from "@/lib/audit"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const employeeId = searchParams.get("employeeId")

    const where: Record<string, unknown> = {}
    if (employeeId) where.employeeId = employeeId

    const vacations = await prisma.vacation.findMany({
      where,
      orderBy: { periodoAquisitivoInicio: "desc" },
      include: {
        employee: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(vacations)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao buscar férias" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get("x-user-id")
  if (!userId) {
    return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      employeeId,
      periodoAquisitivoInicio,
      periodoAquisitivoFim,
      diasDireito = 30,
      diasUtilizados = 0,
      dataInicio,
      dataFim,
      valorFerias,
      status = "PREVISTA",
    } = body

    let adicionalUmTerco = null
    if (valorFerias) {
      adicionalUmTerco = Number(valorFerias) / 3
    }

    const vacation = await prisma.vacation.create({
      data: {
        employeeId,
        periodoAquisitivoInicio: new Date(periodoAquisitivoInicio),
        periodoAquisitivoFim: new Date(periodoAquisitivoFim),
        diasDireito: Number(diasDireito),
        diasUtilizados: Number(diasUtilizados),
        dataInicio: dataInicio ? new Date(dataInicio) : null,
        dataFim: dataFim ? new Date(dataFim) : null,
        valorFerias: valorFerias ? Number(valorFerias) : null,
        adicionalUmTerco,
        status,
      },
      include: {
        employee: { select: { id: true, name: true } },
      },
    })

    await createAuditLog({
      action: "CREATE",
      entity: "Vacation",
      entityId: vacation.id,
      newData: vacation,
      userId,
    })

    return NextResponse.json(vacation, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao criar férias" }, { status: 500 })
  }
}
