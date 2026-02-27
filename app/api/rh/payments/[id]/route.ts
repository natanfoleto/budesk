import { NextRequest, NextResponse } from "next/server"

import { createAuditLog } from "@/lib/audit"
import prisma from "@/lib/prisma"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const payment = await prisma.rHPayment.findUnique({
      where: { id },
      include: {
        employee: { select: { id: true, name: true, role: true } },
        encargos: true,
        rateios: true,
        transaction: true,
      },
    })

    if (!payment) {
      return NextResponse.json({ error: "Pagamento não encontrado" }, { status: 404 })
    }

    return NextResponse.json(payment)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao buscar pagamento" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.headers.get("x-user-id")
  if (!userId) {
    return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const {
      competencia,
      tipoPagamento,
      salarioBase,
      adicionais = 0,
      horasExtras = 0,
      valorHorasExtras = 0,
      descontos = 0,
      valorAdiantamentos = 0,
      status,
      dataPagamento,
      formaPagamento,
      centroCusto,
      observacoes,
    } = body

    const existing = await prisma.rHPayment.findUnique({
      where: { id },
      include: { transaction: true },
    })

    if (!existing) {
      return NextResponse.json({ error: "Pagamento não encontrado" }, { status: 404 })
    }

    const totalBruto = Number(salarioBase ?? existing.salarioBase) + Number(adicionais ?? existing.adicionais) + Number(valorHorasExtras ?? existing.valorHorasExtras)
    const totalLiquido = totalBruto - Number(descontos ?? existing.descontos) - Number(valorAdiantamentos ?? existing.valorAdiantamentos)

    const mergedData = {
      competencia: competencia ?? existing.competencia,
      tipoPagamento: tipoPagamento ?? existing.tipoPagamento,
      salarioBase: salarioBase ?? existing.salarioBase,
      adicionais: adicionais ?? existing.adicionais,
      horasExtras: horasExtras ?? existing.horasExtras,
      valorHorasExtras: valorHorasExtras ?? existing.valorHorasExtras,
      descontos: descontos ?? existing.descontos,
      valorAdiantamentos: valorAdiantamentos ?? existing.valorAdiantamentos,
      totalBruto,
      totalLiquido,
    }

    // If changing to PAGO status and no transaction exists yet → create one
    if (status === "PAGO" && existing.status !== "PAGO" && !existing.transaction) {
      const payment = await prisma.$transaction(async (tx) => {
        const updated = await tx.rHPayment.update({
          where: { id },
          data: {
            ...mergedData,
            status: "PAGO",
            dataPagamento: dataPagamento ? new Date(dataPagamento) : new Date(),
            formaPagamento: formaPagamento ?? existing.formaPagamento ?? null,
            centroCusto: centroCusto ?? existing.centroCusto ?? null,
            observacoes: observacoes ?? existing.observacoes ?? null,
          },
          include: {
            employee: { select: { id: true, name: true, role: true } },
          },
        })

        const valueInCents = Math.round(Number(mergedData.totalLiquido) * 100)

        await tx.financialTransaction.create({
          data: {
            description: `Pagamento RH - ${updated.employee.name} - ${mergedData.competencia}`,
            type: "SAIDA",
            valueInCents,
            category: "Pagamento Funcionário",
            paymentMethod: (formaPagamento ?? existing.formaPagamento ?? "TRANSFERENCIA") as "DINHEIRO" | "PIX" | "CARTAO" | "BOLETO" | "CHEQUE" | "TRANSFERENCIA",
            date: dataPagamento ? new Date(dataPagamento) : new Date(),
            employeeId: updated.employeeId,
            rhPaymentId: id,
          },
        })

        return updated
      })

      await createAuditLog({
        action: "UPDATE",
        entity: "RHPayment",
        entityId: id,
        oldData: existing,
        newData: { ...existing, status: "PAGO" },
        userId,
      })

      return NextResponse.json(payment)
    }

    // If changing from PAGO to another status → delete the linked transaction (rollback)
    if (status !== "PAGO" && existing.status === "PAGO" && existing.transaction) {
      const payment = await prisma.$transaction(async (tx) => {
        // Remove the rhPaymentId reference first (unique constraint)
        await tx.financialTransaction.delete({
          where: { id: existing.transaction!.id },
        })

        return tx.rHPayment.update({
          where: { id },
          data: {
            ...mergedData,
            status: status ?? existing.status,
            dataPagamento: dataPagamento ? new Date(dataPagamento) : null,
            formaPagamento: formaPagamento ?? existing.formaPagamento ?? null,
            centroCusto: centroCusto ?? existing.centroCusto ?? null,
            observacoes: observacoes ?? existing.observacoes ?? null,
          },
        })
      })

      return NextResponse.json(payment)
    }

    // Normal update (no status-related financial side effects)
    const payment = await prisma.rHPayment.update({
      where: { id },
      data: {
        ...mergedData,
        status: status ?? existing.status,
        dataPagamento: dataPagamento ? new Date(dataPagamento) : null,
        formaPagamento: formaPagamento ?? existing.formaPagamento ?? null,
        centroCusto: centroCusto ?? existing.centroCusto ?? null,
        observacoes: observacoes ?? existing.observacoes ?? null,
      },
    })

    await createAuditLog({
      action: "UPDATE",
      entity: "RHPayment",
      entityId: id,
      oldData: existing,
      newData: payment,
      userId,
    })

    return NextResponse.json(payment)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao atualizar pagamento" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.headers.get("x-user-id")
  if (!userId) {
    return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 })
  }

  try {
    const { id } = await params
    const existing = await prisma.rHPayment.findUnique({
      where: { id },
      include: { transaction: true, encargos: true },
    })

    if (!existing) {
      return NextResponse.json({ error: "Pagamento não encontrado" }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      // Rollback: delete associated financial transaction if exists
      if (existing.transaction) {
        await tx.financialTransaction.delete({
          where: { id: existing.transaction.id },
        })
      }

      // EmployerContribution and ProjectAllocation cascade on delete
      await tx.rHPayment.delete({ where: { id } })
    })

    await createAuditLog({
      action: "DELETE",
      entity: "RHPayment",
      entityId: id,
      oldData: existing,
      userId,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao excluir pagamento" }, { status: 500 })
  }
}
