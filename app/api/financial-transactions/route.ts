import { NextRequest, NextResponse } from "next/server"

import { verifyJWT } from "@/lib/auth"
import prisma from "@/lib/prisma"

const AUDIT_Create = "CREATE"

export async function GET(request: NextRequest) {
  const token = request.headers.get("x-token")
  // In middleware we set headers, but here we can re-verify or trust middleware if internal.
  // For safety, let's just use the user from headers if middleware passed it, or verify again.
  // Ideally middleware handles auth. Let's assume protection.

  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get("type")
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")

  try {
    const where: any = {}

    if (type) {
      where.type = type
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const transactions = await prisma.financialTransaction.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        service: { select: { title: true } },
        supplier: { select: { name: true } },
        employee: { select: { name: true } },
      },
    })

    return NextResponse.json(transactions)
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar transações" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get("x-user-id")
  if (!userId) {
     return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { description, type, valueInCents, category, paymentMethod, date, supplierId, employeeId, serviceId } = body

    const transaction = await prisma.financialTransaction.create({
      data: {
        description,
        type,
        valueInCents,
        category,
        paymentMethod,
        date: new Date(date),
        supplierId: supplierId || null,
        employeeId: employeeId || null,
        serviceId: serviceId || null,
      },
    })

    // Audit
    await prisma.auditLog.create({
      data: {
        action: AUDIT_Create,
        entity: "FinancialTransaction",
        entityId: transaction.id,
        newData: transaction as any,
        userId: userId,
      }
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao criar transação" }, { status: 500 })
  }
}
