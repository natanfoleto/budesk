import { AccountStatus, ExpenseCategory, PaymentMethod, Prisma } from "@prisma/client"
import { addMonths } from "date-fns"
import { NextRequest, NextResponse } from "next/server"

import prisma from "@/lib/prisma"
import { AuditService } from "@/src/modules/audit/services/AuditService"

const AUDIT_CREATE = "CREATE"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const statusFilter = searchParams.get("status") // PENDENTE, PAGA, ATRASADA
  const paymentMethod = searchParams.get("paymentMethod")
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")

  try {
    const where: Prisma.AccountPayableWhereInput = {}

    if (paymentMethod) {
      where.paymentMethod = paymentMethod as PaymentMethod
    }

    if (searchParams.get("supplierId")) {
      where.supplierId = searchParams.get("supplierId")
    }

    if (searchParams.get("category")) {
      where.category = searchParams.get("category") as ExpenseCategory
    }

    const page = Number(searchParams.get("page")) || 1
    const limit = Number(searchParams.get("limit")) || 10
    const skip = (page - 1) * limit

    if (startDate && endDate) {
      where.installments = {
        some: {
          dueDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          }
        }
      }
    } else if (startDate) {
      where.installments = {
        some: {
          dueDate: {
            gte: new Date(startDate)
          }
        }
      }
    } else if (endDate) {
      where.installments = {
        some: {
          dueDate: {
            lte: new Date(endDate)
          }
        }
      }
    }

    const accounts = await prisma.accountPayable.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        supplier: { select: { id: true, name: true } },
        installments: {
          orderBy: { installmentNumber: "asc" }
        }
      },
    })

    const processedAccounts = accounts.map(account => {
      const installments = account.installments
      const totalInstallments = installments.length
      const paidInstallments = installments.filter(i => i.status === "PAGA").length
      
      const status = paidInstallments === totalInstallments && totalInstallments > 0
        ? "PAGA"
        : installments.some(i => i.status !== "PAGA" && new Date(i.dueDate) < new Date())
          ? "ATRASADA"
          : "PENDENTE"

      const nextInstallment = installments.find(i => i.status !== "PAGA")

      return {
        ...account,
        status,
        paidInstallmentsCount: paidInstallments,
        nextDueDate: nextInstallment?.dueDate || null
      }
    })

    const filteredAccounts = statusFilter 
      ? processedAccounts.filter(a => a.status === statusFilter)
      : processedAccounts

    filteredAccounts.sort((a, b) => {
      const dateA = a.nextDueDate ? new Date(a.nextDueDate).getTime() : Infinity
      const dateB = b.nextDueDate ? new Date(b.nextDueDate).getTime() : Infinity
      
      if (dateA === Infinity && dateB === Infinity) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      
      return dateA - dateB
    })

    // Manual pagination after filtering by status (since status is computed)
    const paginatedAccounts = filteredAccounts.slice(skip, skip + limit)
    const totalFiltered = filteredAccounts.length

    return NextResponse.json({
      data: paginatedAccounts,
      meta: {
        total: totalFiltered,
        page,
        limit,
        totalPages: Math.ceil(totalFiltered / limit)
      }
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao buscar contas" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get("x-user-id")

  try {
    const body = await request.json()
    const { 
      description, 
      totalValueInCents, 
      installmentsCount, 
      paymentMethod,
      firstDueDate,
      supplierId, 
      costCenterId,
      category,
      attachmentUrl,
      invoiceUrl
    } = body

    const account = await prisma.$transaction(async (tx) => {
      const createdAccount = await tx.accountPayable.create({
        data: {
          description,
          totalValueInCents,
          installmentsCount: installmentsCount || 1,
          paymentMethod: paymentMethod || "BOLETO",
          supplierId: supplierId || null,
          costCenterId: costCenterId || null,
          category: category || "OUTROS",
          attachmentUrl: attachmentUrl || null,
          invoiceUrl: invoiceUrl || null,
          userId: userId || null,
        },
      })

      const installmentBaseValue = Math.floor(totalValueInCents / (installmentsCount || 1))
      const remainder = totalValueInCents - (installmentBaseValue * (installmentsCount || 1))
      
      const installmentsData = []
      const startDate = firstDueDate ? new Date(firstDueDate) : new Date()

      for (let i = 1; i <= (installmentsCount || 1); i++) {
        const value = i === (installmentsCount || 1) ? installmentBaseValue + remainder : installmentBaseValue
        
        installmentsData.push({
          accountPayableId: createdAccount.id,
          installmentNumber: i,
          valueInCents: value,
          dueDate: addMonths(startDate, i - 1),
          status: "PENDENTE" as AccountStatus,
        })
      }

      await tx.accountInstallment.createMany({
        data: installmentsData
      })

      await AuditService.logAction(tx, AUDIT_CREATE, "AccountPayable", createdAccount.id, createdAccount, userId || null)

      return await tx.accountPayable.findUnique({
        where: { id: createdAccount.id },
        include: { installments: true }
      })
    })

    return NextResponse.json(account, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao criar conta" }, { status: 500 })
  }
}
