import { Prisma } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"

import prisma from "@/lib/prisma"
import { AuditService } from "@/src/modules/audit/services/AuditService"
import { FinanceService } from "@/src/modules/finance/services/FinanceService"

const AUDIT_CREATE = "CREATE"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get("status") // PENDENTE, PAGA, ATRASADA
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")

  try {
    const where: Prisma.AccountPayableWhereInput = {}

    if (status) {
      where.status = status as Prisma.AccountPayableWhereInput["status"]
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
    console.error(error)
    return NextResponse.json({ error: "Erro ao buscar contas" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get("x-user-id")

  try {
    const body = await request.json()
    const { description, valueInCents, dueDate, status, supplierId, costCenterId } = body

    const account = await prisma.$transaction(async (tx) => {
      const createdAccount = await tx.accountPayable.create({
        data: {
          description,
          valueInCents,
          dueDate: new Date(dueDate),
          status: status || "PENDENTE",
          supplierId: supplierId || null,
          costCenterId: costCenterId || null,
        },
      })

      // Se nascer já PAGA, gera transação
      if (createdAccount.status === "PAGA") {
        await FinanceService.registerTransaction(tx, {
          type: "SAIDA",
          category: `Contas a Pagar`,
          amountInCents: createdAccount.valueInCents,
          paymentMethod: "TRANSFERENCIA", // default
          description: `Pagamento da Conta: ${createdAccount.description}`,
          date: new Date(),
          costCenterId: createdAccount.costCenterId || undefined,
          referenceId: createdAccount.supplierId || undefined,
          referenceType: createdAccount.supplierId ? "supplier" : undefined,
          userId: userId || undefined
        })
      }

      await AuditService.logAction(tx, AUDIT_CREATE, "AccountPayable", createdAccount.id, createdAccount, userId || null)

      return createdAccount
    })

    return NextResponse.json(account, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao criar conta" }, { status: 500 })
  }
}
