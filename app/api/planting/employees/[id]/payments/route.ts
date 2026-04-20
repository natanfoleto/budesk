import { NextRequest, NextResponse } from "next/server"

import prisma from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: employeeId } = await params
  const { searchParams } = new URL(request.url)
  const seasonId = searchParams.get("seasonId")

  if (!seasonId) {
    return NextResponse.json({ error: "Safra não identificada" }, { status: 400 })
  }

  try {
    const payments = await prisma.plantingPayment.findMany({
      where: {
        employeeId,
        seasonId
      },
      orderBy: { date: "desc" }
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao buscar pagamentos" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: employeeId } = await params
  try {
    const body = await request.json()
    const { 
      date, 
      seasonId, 
      month, 
      year, 
      fortnight, 
      systemBrutoInCents, 
      systemNetInCents, 
      holeriteNetInCents,
      isPaid,
      createAdvance,
      notes 
    } = body

    if (!date || !seasonId || !month || !year || holeriteNetInCents === undefined) {
      return NextResponse.json({ error: "Dados incompletos para registro de pagamento" }, { status: 400 })
    }

    const payment = await prisma.plantingPayment.create({
      data: {
        date: new Date(date),
        employeeId,
        seasonId,
        month: Number(month),
        year: Number(year),
        fortnight: fortnight ? Number(fortnight) : null,
        systemBrutoInCents: Number(systemBrutoInCents),
        systemNetInCents: Number(systemNetInCents),
        holeriteNetInCents: Number(holeriteNetInCents),
        isPaid: Boolean(isPaid),
        notes
      }
    })

    if (createAdvance) {
      const defaultAccount = await prisma.employeeAccount.findFirst({
        where: { employeeId, isDefault: true }
      })

      // Encontrar a última frente de trabalho do funcionário para associar o adiantamento (campo obrigatório)
      let frontId = ""
      const lastProduction = await prisma.plantingProduction.findFirst({ where: { employeeId, seasonId }, orderBy: { date: 'desc' } })
      if (lastProduction) frontId = lastProduction.frontId
      else {
        const lastWage = await prisma.dailyWage.findFirst({ where: { employeeId, seasonId }, orderBy: { date: 'desc' } })
        if (lastWage) frontId = lastWage.frontId
        else {
          const lastDriver = await prisma.driverAllocation.findFirst({ where: { employeeId, seasonId }, orderBy: { date: 'desc' } })
          if (lastDriver) frontId = lastDriver.frontId
          else {
            const anyFront = await prisma.workFront.findFirst({ where: { seasonId } })
            if (anyFront) frontId = anyFront.id
          }
        }
      }

      if (frontId) {
        await prisma.plantingAdvance.create({
          data: {
            employeeId,
            seasonId,
            frontId,
            date: new Date(date),
            valueInCents: Number(holeriteNetInCents),
            accountId: defaultAccount?.id || null,
            notes: `Gerado automaticamente pelo fechamento de holerite${notes ? ` - ${notes}` : ''}`
          }
        })
      }
    }

    return NextResponse.json(payment)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao registrar pagamento" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest
) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const body = await request.json()
    const { isPaid, date, holeriteNetInCents, notes } = body

    if (!id) {
      return NextResponse.json({ error: "ID do pagamento não fornecido" }, { status: 400 })
    }

    const updateData: {
      isPaid?: boolean
      date?: Date
      holeriteNetInCents?: number
      notes?: string
    } = {}
    
    if (isPaid !== undefined) updateData.isPaid = Boolean(isPaid)
    if (date) updateData.date = new Date(date)
    if (holeriteNetInCents !== undefined) updateData.holeriteNetInCents = Number(holeriteNetInCents)
    if (notes !== undefined) updateData.notes = notes

    const payment = await prisma.plantingPayment.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(payment)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao atualizar pagamento" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest
) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "ID do pagamento não fornecido" }, { status: 400 })
  }

  try {
    await prisma.plantingPayment.delete({
      where: { id }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao deletar pagamento" }, { status: 500 })
  }
}
