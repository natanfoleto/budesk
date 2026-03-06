import { AttendanceType, Prisma } from "@prisma/client"
import { AuditAction } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"

import prisma from "@/lib/prisma"
import { AuditService } from "@/src/modules/audit/services/AuditService"
import { TimeBankService } from "@/src/modules/rh/services/TimeBankService"


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
      
      where.date = {
        gte: start,
        lte: end,
      }
    }

    const records = await prisma.attendanceRecord.findMany({
      where,
      orderBy: { date: "desc" },
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
    // Mapping both Old and New payloads seamlessly 
    const employeeId = body.employeeId
    const dateStr = body.date || body.data
    const tipo = body.type || body.tipo
    const horasTrabalhadas = body.workedHours || body.horasTrabalhadas
    const horasExtras = body.overtimeHours || body.horasExtras
    const timeBankImpact = body.timeBankImpact || body.bancoHorasImpacto || (horasExtras ? Number(horasExtras) : null)
    const observacao = body.notes || body.observacao

    const dateObj = new Date(dateStr)
    
    const result = await prisma.$transaction(async (tx) => {
      const record = await tx.attendanceRecord.upsert({
        where: {
          employeeId_date: {
            employeeId,
            date: dateObj,
          }
        },
        update: {
          type: tipo as AttendanceType,
          workedHours: horasTrabalhadas ? Number(horasTrabalhadas) : null,
          overtimeHours: horasExtras ? Number(horasExtras) : null,
          timeBankImpact: timeBankImpact !== null ? Number(timeBankImpact) : null,
          notes: observacao || null,
        },
        create: {
          employeeId,
          date: dateObj,
          type: tipo as AttendanceType,
          workedHours: horasTrabalhadas ? Number(horasTrabalhadas) : null,
          overtimeHours: horasExtras ? Number(horasExtras) : null,
          timeBankImpact: timeBankImpact !== null ? Number(timeBankImpact) : null,
          notes: observacao || null,
        },
        include: { employee: { select: { name: true } } },
      })

      // Garantir sincronização do Banco de Horas
      await TimeBankService.syncTimeBank(tx, employeeId)

      await AuditService.logAction(tx, AuditAction.UPDATE, "AttendanceRecord", record.id, record, userId)

      return record
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao criar/atualizar registro de frequência" }, { status: 500 })
  }
}
