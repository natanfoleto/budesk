import { NextRequest, NextResponse } from "next/server"

import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const month = searchParams.get("month") || new Date().getMonth() + 1
    const year = searchParams.get("year") || new Date().getFullYear()

    const startDate = new Date(`${year}-${month}-01`)
    const endDate = new Date(Number(year), Number(month), 0) // Last day of month

    // 1. Transactions Summary
    const transactions = await prisma.financialTransaction.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        type: true,
        amount: true,
        category: true,
      },
    })

    const income = transactions
      .filter((t) => t.type === "ENTRADA")
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const expense = transactions
      .filter((t) => t.type === "SAIDA")
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const balance = income - expense

    // 2. Accounts Payable Summary
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const afterTomorrow = new Date(tomorrow)
    afterTomorrow.setDate(afterTomorrow.getDate() + 1)

    const payables = await prisma.accountPayable.findMany({
      where: {
        status: "PENDENTE",
      },
    })

    const overdue = payables.filter((p) => new Date(p.dueDate) < today)
    const dueToday = payables.filter(
      (p) =>
        new Date(p.dueDate) >= today && new Date(p.dueDate) < tomorrow
    )
    const dueTomorrow = payables.filter(
      (p) =>
        new Date(p.dueDate) >= tomorrow &&
        new Date(p.dueDate) < afterTomorrow
    )

    // 3. Category Expenses
    const expensesByCategory = transactions
      .filter((t) => t.type === "SAIDA")
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount)
        return acc
      }, {} as Record<string, number>)

    return NextResponse.json({
      summary: {
        income,
        expense,
        balance,
      },
      payables: {
        overdue: overdue.length,
        overdueAmount: overdue.reduce((sum, p) => sum + Number(p.amount), 0),
        dueToday: dueToday.length,
        dueTodayAmount: dueToday.reduce((sum, p) => sum + Number(p.amount), 0),
        dueTomorrow: dueTomorrow.length,
        dueTomorrowAmount: dueTomorrow.reduce((sum, p) => sum + Number(p.amount), 0),
      },
      expensesByCategory: Object.entries(expensesByCategory).map(
        ([category, amount]) => ({ category, amount })
      ),
    })
  } catch {
    return NextResponse.json(
      { error: "Erro ao buscar dados do dashboard" },
      { status: 500 }
    )
  }
}
