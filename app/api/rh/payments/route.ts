import { Prisma, RHPaymentStatus } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"

import prisma from "@/lib/prisma"
import { AuditService } from "@/src/modules/audit/services/AuditService"
import { FinanceService } from "@/src/modules/finance/services/FinanceService"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const employeeId = searchParams.get("employeeId")
    const status = searchParams.get("status") as RHPaymentStatus | null
    const competenceMonth = searchParams.get("competencia") || searchParams.get("competenceMonth")

    const where: Prisma.RHPaymentWhereInput = {}
    if (employeeId) where.employeeId = employeeId
    if (status) where.status = status
    if (competenceMonth) where.competenceMonth = competenceMonth

    const payments = await prisma.rHPayment.findMany({
      where,
      orderBy: [{ competenceMonth: "desc" }, { createdAt: "desc" }],
      include: {
        employee: { select: { id: true, name: true, role: true } },
        taxes: true,
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
    // Support both old PT payload and new EN payload to avoid immediate breakage
    const competenceMonth = body.competenceMonth || body.competencia
    const paymentType = body.paymentType || body.tipoPagamento
    const baseSalaryInCents = body.baseSalaryInCents ?? (body.salarioBase ? Number(body.salarioBase) * 100 : 0)
    const additionsInCents = body.additionsInCents ?? (body.adicionais ? Number(body.adicionais) * 100 : 0)
    const overtimeHours = body.overtimeHours || body.horasExtras || 0
    const overtimeValueInCents = body.overtimeValueInCents ?? (body.valorHorasExtras ? Number(body.valorHorasExtras) * 100 : 0)
    const discountsInCents = body.discountsInCents ?? (body.descontos ? Number(body.descontos) * 100 : 0)
    const advancesValueInCents = body.advancesValueInCents ?? (body.valorAdiantamentos ? Number(body.valorAdiantamentos) * 100 : 0)
    
    const grossTotalInCents = baseSalaryInCents + additionsInCents + overtimeValueInCents
    const netTotalInCents = grossTotalInCents - discountsInCents - advancesValueInCents
    
    const status = body.status || "PENDENTE"
    const paymentDate = body.paymentDate || body.dataPagamento || null
    const paymentMethod = body.paymentMethod || body.formaPagamento || null
    const notes = body.notes || body.observacoes || null
    const costCenterId = body.costCenterId || null // Frontend must eventually send costCenterId

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.rHPayment.create({
        data: {
          employeeId: body.employeeId,
          competenceMonth,
          paymentType,
          baseSalaryInCents,
          additionsInCents,
          overtimeHours,
          overtimeValueInCents,
          discountsInCents,
          advancesValueInCents,
          grossTotalInCents,
          netTotalInCents,
          status,
          paymentDate: paymentDate ? new Date(paymentDate) : null,
          paymentMethod,
          costCenterId,
          notes,
        },
        include: {
          employee: { select: { id: true, name: true, role: true } },
        },
      })

      // Se for pago ou tiver data de pagamento, registrar a transação financeira
      if (status === "PAGO" || paymentDate) {
        await FinanceService.registerTransaction(tx, {
          type: "SAIDA",
          category: `Pagamento RH - ${competenceMonth}`,
          amountInCents: netTotalInCents,
          paymentMethod: paymentMethod || "TRANSFERENCIA",
          description: `Pagamento de ${paymentType} para funcionário`,
          date: paymentDate ? new Date(paymentDate) : new Date(),
          referenceId: payment.id,
          referenceType: "rhPayment",
          costCenterId,
          userId
        })
      }

      await AuditService.logAction(tx, "CREATE", "RHPayment", payment.id, payment, userId)

      return payment
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao criar pagamento" }, { status: 500 })
  }
}
