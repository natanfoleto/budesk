import { AuditAction } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"

import { maintenanceSchema } from "@/components/fleet/maintenance-schema"
import prisma from "@/lib/prisma"
import { AuditService } from "@/src/modules/audit/services/AuditService"
import { FinanceService } from "@/src/modules/finance/services/FinanceService"

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
        supplier: true,
        costCenter: true
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

    const maintenance = await prisma.$transaction(async (tx) => {
      const createdMaintenance = await tx.maintenance.create({
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
          costCenterId: costCenter || undefined, // Mapped to new field
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
        await FinanceService.registerTransaction(tx, {
          type: "SAIDA",
          category: "Manutenção de Veículos",
          amountInCents: estimatedCost,
          paymentMethod: paymentMethod || "TRANSFERENCIA",
          description: `Manutenção - ${category}`,
          date: new Date(),
          referenceId: createdMaintenance.id,
          referenceType: "maintenance",
          costCenterId: costCenter || undefined,
          userId
        })
      }

      await AuditService.logAction(tx, AuditAction.CREATE, "Maintenance", createdMaintenance.id, createdMaintenance, userId)

      return createdMaintenance
    })

    return NextResponse.json(maintenance, { status: 201 })
  } catch (error) {
    console.error("Error creating maintenance:", error)
    return NextResponse.json({ error: "Erro ao criar manutenção" }, { status: 500 })
  }
}
