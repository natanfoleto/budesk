import { NextRequest, NextResponse } from "next/server"

import { createAuditLog } from "@/lib/audit"
import prisma from "@/lib/prisma"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.headers.get("x-user-id")
  if (!userId) return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 })

  try {
    const { id } = await params
    const body = await request.json()
    const {
      periodoAquisitivoInicio,
      periodoAquisitivoFim,
      diasDireito,
      diasUtilizados,
      dataInicio,
      dataFim,
      valorFerias,
      status,
    } = body

    const existing = await prisma.vacation.findUnique({
      where: { id },
    })

    if (!existing) return NextResponse.json({ error: "Férias não encontradas" }, { status: 404 })

    let adicionalUmTerco: number | null = existing.adicionalUmTerco as number | null
    if (valorFerias !== undefined) {
      adicionalUmTerco = valorFerias ? Number(valorFerias) / 3 : null
    }

    const start = dataInicio ? new Date(dataInicio) : existing.dataInicio
    
    // Automatically generate RHPayment + Transaction if moved to "PAGA" and valorFerias is set
    if (status === "PAGA" && existing.status !== "PAGA" && valorFerias) {
      const vacation = await prisma.$transaction(async (tx) => {
        const updated = await tx.vacation.update({
          where: { id },
          data: {
            periodoAquisitivoInicio: periodoAquisitivoInicio ? new Date(periodoAquisitivoInicio) : undefined,
            periodoAquisitivoFim: periodoAquisitivoFim ? new Date(periodoAquisitivoFim) : undefined,
            diasDireito: diasDireito !== undefined ? Number(diasDireito) : undefined,
            diasUtilizados: diasUtilizados !== undefined ? Number(diasUtilizados) : undefined,
            dataInicio: start,
            dataFim: dataFim ? new Date(dataFim) : undefined,
            valorFerias: Number(valorFerias),
            adicionalUmTerco,
            status: "PAGA",
          },
          include: { employee: { select: { id: true, name: true } } },
        })

        const totalLiquido = Number(valorFerias) + Number(adicionalUmTerco)
        const compDate = start || new Date()
        const competenciaStr = `${compDate.getFullYear()}-${String(compDate.getMonth() + 1).padStart(2, "0")}`

        // Create the abstract RHPayment
        const rhPayment = await tx.rHPayment.create({
          data: {
            employeeId: updated.employeeId,
            competencia: competenciaStr,
            tipoPagamento: "FERIAS",
            salarioBase: Number(valorFerias),
            adicionais: Number(adicionalUmTerco),
            totalBruto: totalLiquido,
            totalLiquido: totalLiquido,
            status: "PAGO",
            dataPagamento: new Date(),
            observacoes: `Férias pagas referente ao período ${updated.periodoAquisitivoInicio.getFullYear()}/${updated.periodoAquisitivoFim.getFullYear()}`
          }
        })

        // Create the actual cash outflow
        await tx.financialTransaction.create({
          data: {
            description: `Pagamento de Férias - ${updated.employee.name} - ${competenciaStr}`,
            type: "SAIDA",
            valueInCents: Math.round(totalLiquido * 100),
            category: "Pagamento Férias",
            paymentMethod: "TRANSFERENCIA", // default assumption for automated
            date: new Date(),
            employeeId: updated.employeeId,
            rhPaymentId: rhPayment.id,
          },
        })

        return updated
      })

      await createAuditLog({
        action: "UPDATE",
        entity: "Vacation",
        entityId: id,
        oldData: existing,
        newData: vacation,
        userId,
      })

      return NextResponse.json(vacation)
    }

    // Normal Update without auto-payment generation
    const vacation = await prisma.vacation.update({
      where: { id },
      data: {
        periodoAquisitivoInicio: periodoAquisitivoInicio ? new Date(periodoAquisitivoInicio) : undefined,
        periodoAquisitivoFim: periodoAquisitivoFim ? new Date(periodoAquisitivoFim) : undefined,
        diasDireito: diasDireito !== undefined ? Number(diasDireito) : undefined,
        diasUtilizados: diasUtilizados !== undefined ? Number(diasUtilizados) : undefined,
        dataInicio: dataInicio !== undefined ? (dataInicio ? new Date(dataInicio) : null) : undefined,
        dataFim: dataFim !== undefined ? (dataFim ? new Date(dataFim) : null) : undefined,
        valorFerias: valorFerias !== undefined ? (valorFerias ? Number(valorFerias) : null) : undefined,
        adicionalUmTerco,
        status,
      },
    })

    return NextResponse.json(vacation)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao atualizar férias" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.headers.get("x-user-id")
  if (!userId) return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 })

  try {
    const { id } = await params
    const existing = await prisma.vacation.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Férias não encontradas" }, { status: 404 })

    await prisma.vacation.delete({ where: { id } })

    await createAuditLog({
      action: "DELETE",
      entity: "Vacation",
      entityId: id,
      oldData: existing,
      userId,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao excluir férias" }, { status: 500 })
  }
}
