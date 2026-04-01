import { NextRequest, NextResponse } from "next/server"

import { createAuditLog } from "@/lib/audit"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const employeeId = searchParams.get("employeeId")

    const where: Record<string, unknown> = {}
    if (employeeId) where.employeeId = employeeId

    const thirteenths = await prisma.thirteenthSalary.findMany({
      where,
      orderBy: [{ referenceYear: "desc" }, { createdAt: "desc" }],
      include: {
        employee: { 
          select: { 
            id: true, 
            name: true, 
            role: true,
            employmentRecords: {
              orderBy: { admissionDate: "desc" },
              take: 1
            }
          } 
        },
      },
    })

    return NextResponse.json(thirteenths)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao buscar 13º salário" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get("x-user-id")
  if (!userId) {
    return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { employeeId, referenceYear, workedMonths } = body

    const employee = await prisma.employee.findUnique({ 
      where: { id: employeeId },
      include: {
        employmentRecords: {
          orderBy: { admissionDate: "desc" },
          take: 1
        }
      }
    })
    if (!employee) return NextResponse.json({ error: "Funcionário não encontrado" }, { status: 404 })

    const baseSalaryInCents = Number(employee.employmentRecords?.[0]?.baseSalaryInCents || 0)
    const totalAmountInCents = Math.round((baseSalaryInCents / 12) * Number(workedMonths))

    const thirteenth = await prisma.thirteenthSalary.create({
      data: {
        employeeId,
        referenceYear: Number(referenceYear),
        workedMonths: Number(workedMonths),
        totalAmountInCents,
        status: "PENDENTE",
      },
      include: { employee: { select: { id: true, name: true } } },
    })

    await createAuditLog({
      action: "CREATE",
      entity: "ThirteenthSalary",
      entityId: thirteenth.id,
      newData: thirteenth,
      userId,
    })

    return NextResponse.json(thirteenth, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao criar 13º salário" }, { status: 500 })
  }
}
