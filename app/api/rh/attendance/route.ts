import { AttendanceType, Prisma } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"

import { createAuditLog } from "@/lib/audit"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const employeeId = searchParams.get("employeeId")
    const month = searchParams.get("month") // format "YYYY-MM"

    const where: Prisma.AttendanceRecordWhereInput = {}
    if (employeeId) where.employeeId = employeeId

    if (month) {
      const year = parseInt(month.split("-")[0])
      const m = parseInt(month.split("-")[1]) - 1 // 0-indexed
      const start = new Date(year, m, 1)
      const end = new Date(year, m + 1, 0, 23, 59, 59)
      
      where.data = {
        gte: start,
        lte: end,
      }
    }

    const records = await prisma.attendanceRecord.findMany({
      where,
      orderBy: { data: "desc" },
      include: {
        employee: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(records)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao buscar registro de frequência" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get("x-user-id")
  if (!userId) {
    return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { employeeId, data, tipo, horasTrabalhadas, horasExtras, observacao } = body

    // Check for existing record on the exact same date
    const dateObj = new Date(data)
    
    // Create UTC date matching the local date string to store in DB as pure Date 
    // We use standard JS date, Prisma maps it to Postgre Date
    const record = await prisma.attendanceRecord.upsert({
      where: {
        employeeId_data: {
          employeeId,
          data: dateObj,
        }
      },
      update: {
        tipo: tipo as AttendanceType,
        horasTrabalhadas: horasTrabalhadas ? Number(horasTrabalhadas) : null,
        horasExtras: horasExtras ? Number(horasExtras) : null,
        observacao: observacao || null,
      },
      create: {
        employeeId,
        data: dateObj,
        tipo: tipo as AttendanceType,
        horasTrabalhadas: horasTrabalhadas ? Number(horasTrabalhadas) : null,
        horasExtras: horasExtras ? Number(horasExtras) : null,
        observacao: observacao || null,
      },
      include: { employee: { select: { name: true } } },
    })

    await createAuditLog({
      action: "CREATE", // logic: treated as create/update audit
      entity: "AttendanceRecord",
      entityId: record.id,
      newData: record,
      userId,
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao criar/atualizar registro de frequência" }, { status: 500 })
  }
}
