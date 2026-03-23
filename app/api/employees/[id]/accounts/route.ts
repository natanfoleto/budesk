import { NextRequest, NextResponse } from "next/server"

import { createAuditLog } from "@/lib/audit"
import prisma from "@/lib/prisma"
import { EmployeeAccountFormData } from "@/types/employee"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const accounts = await prisma.employeeAccount.findMany({
      where: { employeeId: id },
      orderBy: { createdAt: "desc" }
    })
    return NextResponse.json(accounts)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao buscar contas" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.headers.get("x-user-id")
  if (!userId) {
    return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 })
  }

  const { id } = await params
  try {
    const body: EmployeeAccountFormData = await request.json()
    
    // If this is the first account or marked as default, handle default status
    if (body.isDefault) {
      await prisma.employeeAccount.updateMany({
        where: { employeeId: id },
        data: { isDefault: false }
      })
    } else {
      // Check if there are any accounts; if not, make this one default
      const count = await prisma.employeeAccount.count({ where: { employeeId: id } })
      if (count === 0) {
        body.isDefault = true
      }
    }

    const account = await prisma.employeeAccount.create({
      data: {
        employeeId: id,
        type: body.type,
        identifier: body.identifier,
        description: body.description,
        isDefault: body.isDefault || false
      }
    })

    await createAuditLog({
      action: "CREATE",
      entity: "EmployeeAccount",
      entityId: account.id,
      newData: account,
      userId
    })

    return NextResponse.json(account)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao criar conta" }, { status: 500 })
  }
}
