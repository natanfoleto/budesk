import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

const AUDIT_Create = "CREATE"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const contracts = await prisma.employeeContract.findMany({
      where: { employeeId: id },
      orderBy: { startDate: "desc" }
    })
    return NextResponse.json(contracts)
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar contratos" }, { status: 500 })
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
    const body = await request.json()
    const { 
      type, startDate, endDate, value, status, description, fileUrl 
    } = body

    const contract = await prisma.employeeContract.create({
      data: {
        employeeId: id,
        type,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        value,
        status: status || "ACTIVE",
        description,
        fileUrl
      }
    })

     // Audit
     await prisma.auditLog.create({
      data: {
        action: AUDIT_Create,
        entity: "EmployeeContract",
        entityId: contract.id,
        newData: contract as any,
        userId: userId,
      }
    })

    return NextResponse.json(contract, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar contrato" }, { status: 500 })
  }
}
