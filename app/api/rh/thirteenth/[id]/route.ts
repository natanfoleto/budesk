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
    const { primeiraParcela, segundaParcela, primeiraPaga, segundaPaga } = body

    const existing = await prisma.thirteenthSalary.findUnique({
      where: { id },
      include: { employee: true },
    })

    if (!existing) return NextResponse.json({ error: "13º Salário não encontrado" }, { status: 404 })

    // Determine Status
    let status: "PENDENTE" | "PARCIAL" | "PAGO" = "PENDENTE"
    if (primeiraPaga && segundaPaga) status = "PAGO"
    else if (primeiraPaga || segundaPaga) status = "PARCIAL"

    const data: {
      status: "PENDENTE" | "PARCIAL" | "PAGO"
      primeiraParcela?: number
      segundaParcela?: number
      primeiraPaga?: boolean
      segundaPaga?: boolean
    } = { status }
    
    if (primeiraParcela !== undefined) data.primeiraParcela = Number(primeiraParcela)
    if (segundaParcela !== undefined) data.segundaParcela = Number(segundaParcela)
    if (primeiraPaga !== undefined) data.primeiraPaga = primeiraPaga
    if (segundaPaga !== undefined) data.segundaPaga = segundaPaga

    // Payment Logic - We could generate a full RHPayment here too, but to keep it simple, 
    // we'll just generate the financial transaction right away for whichever parcel was just paid.
    
    const thirteenth = await prisma.$transaction(async (tx) => {
      const updated = await tx.thirteenthSalary.update({
        where: { id },
        data,
      })

      const now = new Date()
      const compStr = `${updated.anoReferencia}-13`

      // If primeira parcel was JUST marked as paid
      if (primeiraPaga && !existing.primeiraPaga && data.primeiraParcela) {
        
        const rh1 = await tx.rHPayment.create({
          data: {
            employeeId: updated.employeeId,
            competencia: compStr,
            tipoPagamento: "DECIMO_TERCEIRO",
            salarioBase: Number(data.primeiraParcela),
            totalBruto: Number(data.primeiraParcela),
            totalLiquido: Number(data.primeiraParcela),
            status: "PAGO",
            dataPagamento: now,
            observacoes: `1ª Parcela do 13º Salário (${updated.anoReferencia})`
          }
        })

        await tx.financialTransaction.create({
          data: {
            description: `1ª Parcela 13º - ${existing.employee.name} - ${updated.anoReferencia}`,
            type: "SAIDA",
            valueInCents: Math.round(Number(data.primeiraParcela) * 100),
            category: "Pagamento 13º",
            paymentMethod: "TRANSFERENCIA",
            date: now,
            employeeId: updated.employeeId,
            rhPaymentId: rh1.id,
          },
        })
      }

      // If segunda parcel was JUST marked as paid
      if (segundaPaga && !existing.segundaPaga && data.segundaParcela) {
        const rh2 = await tx.rHPayment.create({
          data: {
            employeeId: updated.employeeId,
            competencia: compStr,
            tipoPagamento: "DECIMO_TERCEIRO",
            salarioBase: Number(data.segundaParcela),
            totalBruto: Number(data.segundaParcela),
            totalLiquido: Number(data.segundaParcela), // simplificando impostos descontados via campos na UI se quiser
            status: "PAGO",
            dataPagamento: now,
            observacoes: `2ª Parcela do 13º Salário (${updated.anoReferencia})`
          }
        })

        await tx.financialTransaction.create({
          data: {
            description: `2ª Parcela 13º - ${existing.employee.name} - ${updated.anoReferencia}`,
            type: "SAIDA",
            valueInCents: Math.round(Number(data.segundaParcela) * 100),
            category: "Pagamento 13º",
            paymentMethod: "TRANSFERENCIA",
            date: now,
            employeeId: updated.employeeId,
            rhPaymentId: rh2.id,
          },
        })
      }

      return updated
    })

    await createAuditLog({
      action: "UPDATE",
      entity: "ThirteenthSalary",
      entityId: id,
      oldData: existing,
      newData: thirteenth,
      userId,
    })

    return NextResponse.json(thirteenth)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao atualizar 13º salário" }, { status: 500 })
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
    const existing = await prisma.thirteenthSalary.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "13º Salário não encontrado" }, { status: 404 })

    await prisma.thirteenthSalary.delete({ where: { id } })

    await createAuditLog({
      action: "DELETE",
      entity: "ThirteenthSalary",
      entityId: id,
      oldData: existing,
      userId,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao excluir 13º salário" }, { status: 500 })
  }
}
