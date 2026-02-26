import { NextRequest, NextResponse } from "next/server"

import { createAuditLog } from "@/lib/audit"
import prisma from "@/lib/prisma"

const AUDIT_Update = "UPDATE"
const AUDIT_Delete = "DELETE"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        employmentRecords: { orderBy: { createdAt: "desc" } },
        contracts: { orderBy: { createdAt: "desc" } },
      }
    })

    if (!employee) {
      return NextResponse.json({ error: "Funcionário não encontrado" }, { status: 404 })
    }

    return NextResponse.json(employee)
  } catch (error) {
    console.log(error)
    
    return NextResponse.json({ error: "Erro ao buscar funcionário" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.headers.get("x-user-id")
  if (!userId) {
    return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const { 
      name, email, phone, document, rg, birthDate, gender, 
      shirtSize, pantsSize, shoeSize, role, salaryInCents, active 
    } = body

    const oldData = await prisma.employee.findUnique({ where: { id } })

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        document,
        rg,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        gender,
        shirtSize: shirtSize || null,
        pantsSize,
        shoeSize,
        role,
        salaryInCents,
        active
      }
    })

    // Audit
    await createAuditLog({
      action: AUDIT_Update,
      entity: "Employee",
      entityId: id,
      oldData: oldData,
      newData: employee,
      userId: userId,
    })

    return NextResponse.json(employee)
  } catch (error) {
    console.log(error)
    
    return NextResponse.json({ error: "Erro ao atualizar funcionário" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.headers.get("x-user-id")
  if (!userId) {
    return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 })
  }

  const { id } = await params

  try {
    const oldData = await prisma.employee.findUnique({ where: { id } })

    if (!oldData) {
      return NextResponse.json({ error: "Funcionário não encontrado" }, { status: 404 })
    }

    // Delete everything in a transaction to ensure integrity
    await prisma.$transaction(async (tx) => {
      // 1. Delete advances (depends on employee)
      await tx.employeeAdvance.deleteMany({
        where: { employeeId: id }
      })

      // 2. Delete attendance records (depends on employee)
      await tx.attendanceRecord.deleteMany({
        where: { employeeId: id }
      })

      // 3. Delete employment records (depends on employee)
      await tx.employmentRecord.deleteMany({
        where: { employeeId: id }
      })

      // 4. Delete contracts (depends on employee)
      await tx.employeeContract.deleteMany({
        where: { employeeId: id }
      })

      // 5. Delete financial transactions linked to this employee
      await tx.financialTransaction.deleteMany({
        where: { employeeId: id }
      })

      // 6. Finally delete the employee
      await tx.employee.delete({
        where: { id }
      })
    })

    // Audit
    await createAuditLog({
      action: AUDIT_Delete,
      entity: "Employee",
      entityId: id,
      oldData: oldData,
      userId: userId,
      newData: undefined 
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error: "Erro ao excluir funcionário." }, { status: 500 })
  }
}
