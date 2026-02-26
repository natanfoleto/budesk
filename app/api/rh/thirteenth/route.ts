import { NextRequest, NextResponse } from "next/server"

import { createAuditLog } from "@/lib/audit"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const employeeId = searchParams.get("employeeId")

    const where: Record<string, unknown> = {}
    if (employeeId) where.employeeId = employeeId

    const thirteenths = await prisma.thirteenthSalary.findMany({
      where,
      orderBy: [{ anoReferencia: "desc" }, { createdAt: "desc" }],
      include: {
        employee: { select: { id: true, name: true, role: true, salaryInCents: true } },
      },
    })

    return NextResponse.json(thirteenths)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao buscar 13º salário" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get("x-user-id")
  if (!userId) {
    return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { employeeId, anoReferencia, mesesTrabalhados } = body

    const employee = await prisma.employee.findUnique({ where: { id: employeeId } })
    if (!employee) return NextResponse.json({ error: "Funcionário não encontrado" }, { status: 404 })

    const salarioBase = Number(employee.salaryInCents || 0) / 100
    const valorTotal = (salarioBase / 12) * Number(mesesTrabalhados)

    const thirteenth = await prisma.thirteenthSalary.create({
      data: {
        employeeId,
        anoReferencia: Number(anoReferencia),
        mesesTrabalhados: Number(mesesTrabalhados),
        valorTotal,
        status: "PENDENTE",
      },
      include: { employee: { select: { id: true, name: true } } },
    })

    await createAuditLog({
      action: "CREATE",
      entity: "ThirteenthSalary",
      entityId: thirteenth.id,
      newData: thirteenth,
      userId,
    })

    return NextResponse.json(thirteenth, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao criar 13º salário" }, { status: 500 })
  }
}
