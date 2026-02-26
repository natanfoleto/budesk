import { NextRequest, NextResponse } from "next/server"

import { createAuditLog } from "@/lib/audit"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const employeeId = searchParams.get("employeeId")
    const status = searchParams.get("status")
    const competencia = searchParams.get("competencia")

    const where: Record<string, unknown> = {}
    if (employeeId) where.employeeId = employeeId
    if (status) where.status = status
    if (competencia) where.competencia = competencia

    const payments = await prisma.rHPayment.findMany({
      where,
      orderBy: [{ competencia: "desc" }, { createdAt: "desc" }],
      include: {
        employee: { select: { id: true, name: true, role: true } },
        encargos: true,
      },
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao buscar pagamentos" }, { status: 500 })
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
      competencia,
      tipoPagamento,
      salarioBase,
      adicionais = 0,
      horasExtras = 0,
      valorHorasExtras = 0,
      descontos = 0,
      valorAdiantamentos = 0,
      status = "PENDENTE",
      dataPagamento,
      formaPagamento,
      centroCusto,
      observacoes,
    } = body

    const totalBruto = Number(salarioBase) + Number(adicionais) + Number(valorHorasExtras)
    const totalLiquido = totalBruto - Number(descontos) - Number(valorAdiantamentos)

    const payment = await prisma.rHPayment.create({
      data: {
        employeeId,
        competencia,
        tipoPagamento,
        salarioBase,
        adicionais,
        horasExtras,
        valorHorasExtras,
        descontos,
        valorAdiantamentos,
        totalBruto,
        totalLiquido,
        status,
        dataPagamento: dataPagamento ? new Date(dataPagamento) : null,
        formaPagamento: formaPagamento || null,
        centroCusto: centroCusto || null,
        observacoes: observacoes || null,
      },
      include: {
        employee: { select: { id: true, name: true, role: true } },
      },
    })

    await createAuditLog({
      action: "CREATE",
      entity: "RHPayment",
      entityId: payment.id,
      newData: payment,
      userId,
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao criar pagamento" }, { status: 500 })
  }
}
