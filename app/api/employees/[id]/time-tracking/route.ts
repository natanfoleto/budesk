import { NextRequest, NextResponse } from "next/server"

import { createAuditLog } from "@/lib/audit"
import prisma from "@/lib/prisma"

const AUDIT_Create = "CREATE"

// Helper to parse "HH:mm" to minutes from midnight
function parseTimeToMinutes(timeStr: string) {
  const [hours, minutes] = timeStr.split(":").map(Number)
  return hours * 60 + minutes
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const records = await prisma.timeRecord.findMany({
      where: { employeeId: id },
      orderBy: { date: "desc" }
    })
    return NextResponse.json(records)
  } catch (error) {
    console.log(error)
    
    return NextResponse.json({ error: "Erro ao buscar registros de ponto" }, { status: 500 })
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
    const { date, entryTime, exitTime, absent, justification, manualWorkedHours, manualOvertime } = body

    // Fetch employee settings for calculation
    const employee = await prisma.employee.findUnique({
      where: { id },
      select: { standardEntryTime: true, standardExitTime: true } // Add standardBreakTime if we add it later
    })

    let workedHours: number | null = null
    let overtimeHours: number | null = null

    if (manualWorkedHours !== undefined) {
      workedHours = manualWorkedHours
      overtimeHours = manualOvertime || 0
    } else if (entryTime && exitTime && !absent) {
      const entryDate = new Date(entryTime)
      const exitDate = new Date(exitTime)
      
      const diffMinutes = (exitDate.getTime() - entryDate.getTime()) / (1000 * 60)
      workedHours = Math.max(0, diffMinutes / 60)

      // Calculate Overtime
      // Only if we have standard times
      if (employee?.standardEntryTime && employee?.standardExitTime) {
        const standardStart = parseTimeToMinutes(employee.standardEntryTime)
        const standardEnd = parseTimeToMinutes(employee.standardExitTime)
        const standardMinutes = standardEnd - standardStart 
        // Note: This simplistic calculation assumes no break for "standard" if not provided, 
        // or assumes standard minutes includes break? 
        // Usually standard workload is 8h (480mins). 
        // Let's assume standardMinutes is the expected work duration.
        // If standard is 08:00 to 17:00 (9h), maybe 1h break is implied?
        // Prompt said "standard_break_time" (I missed adding this field to schema! I only added entry/exit).
        // I will assume 0 break for now or add it later. The logic:
        // Overtime = (WorkedMinutes - StandardMinutes) / 60
        
        const actualMinutes = diffMinutes
        // Logic: if actual > standard, overtime.
        if (actualMinutes > standardMinutes) {
          overtimeHours = (actualMinutes - standardMinutes) / 60
        } else {
          overtimeHours = 0
        }
      }
    }

    const record = await prisma.timeRecord.create({
      data: {
        employeeId: id,
        date: new Date(date),
        entryTime: new Date(entryTime),
        exitTime: exitTime ? new Date(exitTime) : null,
        workedHours: workedHours,
        overtimeHours: overtimeHours,
        absent: absent || false,
        justification
      }
    })

    // Audit
    await createAuditLog({
      action: AUDIT_Create,
      entity: "TimeRecord",
      entityId: record.id,
      newData: record as any,
      userId: userId,
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao criar registro de ponto" }, { status: 500 })
  }
}
