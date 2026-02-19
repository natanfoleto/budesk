import { AuditAction } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"

import { maintenanceSchema } from "@/components/fleet/maintenance-schema"
import { createAuditLog } from "@/lib/audit"
import prisma from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    const maintenances = await prisma.maintenance.findMany({
      where: { 
        vehicleId: id,
        active: true
      },
      orderBy: { scheduledDate: "desc" },
      include: {
        supplier: true
      }
    })
    return NextResponse.json(maintenances)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao buscar manutenções" }, { status: 500 })
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
    
    // Validate with Zod
    const validationResult = maintenanceSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validationResult.error.format() },
        { status: 400 }
      )
    }

    const { 
      type, category, description, priority,
      scheduledDate, isRecurrent, intervalKm, intervalDays,
      estimatedCost, costCenter, supplierId, invoiceNumber,
      status, internalNotes, approvalResponsible, operationalImpact,
      isPaid, paymentMethod
    } = validationResult.data

    const maintenance = await prisma.maintenance.create({
      data: {
        vehicleId: id,
        type,
        category,
        description,
        priority,
        scheduledDate: new Date(scheduledDate),
        isRecurrent: isRecurrent || false,
        intervalKm,
        intervalDays,
        estimatedCost,
        costCenter,
        supplierId,
        invoiceNumber,
        status: status || "PENDENTE",
        isPaid,
        internalNotes,
        approvalResponsible,
        operationalImpact
      }
    })

    // Financial Transaction Logic
    if (isPaid && estimatedCost > 0) {
      await prisma.financialTransaction.create({
        data: {
          description: `Manutenção - ${category}`,
          type: "SAIDA",
          category: "Manutenção de Veículos",
          valueInCents: estimatedCost,
          paymentMethod: paymentMethod || "TRANSFERENCIA",
          date: new Date(),
          // serviceId? No, it's maintenance
          maintenanceId: maintenance.id,
          supplierId: supplierId
        }
      })
    }

    // Audit
    await createAuditLog({
      action: AuditAction.CREATE,
      entity: "Maintenance",
      entityId: maintenance.id,
      newData: maintenance,
      userId: userId,
    })

    return NextResponse.json(maintenance, { status: 201 })
  } catch (error) {
    console.error("Error creating maintenance:", error)
    return NextResponse.json({ error: "Erro ao criar manutenção" }, { status: 500 })
  }
}
