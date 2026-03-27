import { Prisma, TransactionType } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"

import prisma from "@/lib/prisma"

const AUDIT_Create = "CREATE"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get("type")
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")

  try {
    const where: Prisma.FinancialTransactionWhereInput = {}

    const page = Number(searchParams.get("page")) || 1
    const limit = Number(searchParams.get("limit")) || 10
    const skip = (page - 1) * limit

    if (type) {
      where.type = type as TransactionType
    }
    
    if (searchParams.get("supplierId")) {
      where.supplierId = searchParams.get("supplierId")
    }

    if (searchParams.get("conciled")) {
      where.conciled = searchParams.get("conciled") === "true"
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const [total, transactions] = await Promise.all([
      prisma.financialTransaction.count({ where }),
      prisma.financialTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: "desc" },
        include: {
          service: { select: { title: true } },
          supplier: { select: { name: true } },
          employee: { select: { name: true } },
        },
      })
    ])

    return NextResponse.json({
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Erro ao buscar transações:", error)
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
    const { 
      description, 
      type, 
      valueInCents, 
      category, 
      paymentMethod, 
      date, 
      supplierId, 
      employeeId, 
      serviceId, 
      attachmentUrl, 
      conciled 
    } = body

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
        attachmentUrl: attachmentUrl || null,
        conciled: conciled || false,
        userId: userId,
      },
    })

    // Audit
    await prisma.auditLog.create({
      data: {
        action: AUDIT_Create,
        entity: "FinancialTransaction",
        entityId: transaction.id,
        newData: transaction as unknown as Prisma.InputJsonValue,
        userId: userId,
      }
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar transação:", error)
    return NextResponse.json({ error: "Erro ao criar transação" }, { status: 500 })
  }
}
