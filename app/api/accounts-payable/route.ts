import { NextRequest, NextResponse } from "next/server"

import prisma from "@/lib/prisma"

const AUDIT_CREATE = "CREATE"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get("status") // PENDENTE, PAGA, ATRASADA
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")

  try {
    const where: any = {}

    if (status) {
      where.status = status
    }

    if (startDate && endDate) {
      where.dueDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const accounts = await prisma.accountPayable.findMany({
      where,
      orderBy: { dueDate: "asc" },
      include: {
        supplier: { select: { name: true } },
      },
    })

    return NextResponse.json(accounts)
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar contas" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get("x-user-id")

  try {
    const body = await request.json()
    const { description, amount, dueDate, status, supplierId } = body

    const account = await prisma.accountPayable.create({
      data: {
        description,
        amount,
        dueDate: new Date(dueDate),
        status: status || "PENDENTE",
        supplierId: supplierId || null,
      },
    })

    await prisma.auditLog.create({
      data: {
        action: AUDIT_CREATE,
        entity: "AccountPayable",
        entityId: account.id,
        newData: account as any,
        userId: userId,
      }
    })

    return NextResponse.json(account, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar conta" }, { status: 500 })
  }
}
