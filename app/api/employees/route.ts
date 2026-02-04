import { NextRequest, NextResponse } from "next/server"

import { createAuditLog } from "@/lib/audit"
import prisma from "@/lib/prisma"

const AUDIT_Create = "CREATE"

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { name: "asc" },
    })
    return NextResponse.json(employees)
  } catch (error) {
    console.log(error)
    
    return NextResponse.json({ error: "Erro ao buscar funcionários" }, { status: 500 })
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
      name, email, phone, document, rg, birthDate, gender, 
      shirtSize, pantsSize, shoeSize, role, salaryInCents 
    } = body

    const employee = await prisma.employee.create({
      data: {
        name,
        email,
        phone,
        document,
        rg,
        birthDate: birthDate ? new Date(birthDate) : null,
        gender,
        shirtSize: shirtSize || null,
        pantsSize,
        shoeSize,
        role,
        salaryInCents,
        active: true
      }
    })

    // Audit
    await createAuditLog({
      action: AUDIT_Create,
      entity: "Employee",
      entityId: employee.id,
      newData: employee,
      userId: userId,
    })

    return NextResponse.json(employee, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao criar funcionário" }, { status: 500 })
  }
}
