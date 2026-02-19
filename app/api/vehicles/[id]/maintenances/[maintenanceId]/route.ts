import { AuditAction, Prisma } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"

import { maintenanceSchema } from "@/components/fleet/maintenance-schema"
import { createAuditLog } from "@/lib/audit"
import prisma from "@/lib/prisma"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; maintenanceId: string }> }
) {
  const userId = request.headers.get("x-user-id")
  if (!userId) {
    return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 })
  }
  
  const { id, maintenanceId } = await params

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
      scheduledDate, completedDate, currentKm, 
      isRecurrent, intervalKm, intervalDays, isPaid,
      estimatedCost, finalCost, costCenter, supplierId, invoiceNumber,
      status, internalNotes, approvalResponsible, operationalImpact,
      downtimeDays, paymentMethod
    } = validationResult.data

    const existingMaintenance = await prisma.maintenance.findUnique({
      where: { id: maintenanceId },
      include: { transaction: true, vehicle: true }
    })

    if (!existingMaintenance) {
      return NextResponse.json({ error: "Manutenção não encontrada" }, { status: 404 })
    }

    // Logic for Status Change
    const isCompleting = status === "REALIZADA" && existingMaintenance.status !== "REALIZADA"
    const isRollingBack = status !== "REALIZADA" && existingMaintenance.status === "REALIZADA"

    // Prepare Update Data
    // Prepare Update Data
    const updateData: Prisma.MaintenanceUncheckedUpdateInput = {
      type, category, description, priority,
      scheduledDate: new Date(scheduledDate),
      isRecurrent, 
      intervalKm,
      intervalDays,
      isPaid,
      estimatedCost,
      finalCost,
      costCenter,
      supplierId,
      invoiceNumber,
      status, 
      internalNotes, 
      approvalResponsible, 
      operationalImpact,
      downtimeDays,
      completedDate: completedDate ? new Date(completedDate) : null,
      currentKm,
      // paymentMethod is not directly on Maintenance, it's for the transaction. 
      // We should extract it before creating the update object if it's not part of Maintenance model.
      // However, if we want to keep it here for now, we might need to cast or omit it.
      // Looking at the original code, 'paymentMethod' was in the object but commented "Although not in schema".
      // Prisma.MaintenanceUpdateInput will fail if paymentMethod is not in the schema.
      // I will remove paymentMethod from this object since it is used later for transaction logic anyway.
    }

    if (isCompleting) {
      if (!updateData.completedDate) updateData.completedDate = new Date()
      // If finalCost is not provided, use estimatedCost
      if (updateData.finalCost === null || updateData.finalCost === undefined) {
        updateData.finalCost = updateData.estimatedCost
      }
    }

    if (isRollingBack) {
      updateData.completedDate = null
      updateData.finalCost = null
    }

    // Execute Update
    const maintenance = await prisma.maintenance.update({
      where: { id: maintenanceId },
      data: updateData,
      include: {
        vehicle: true
      }
    })

    // --- Business Logic: Financials ---
    
    // 1. Handle isPaid / Transaction Control
    const shouldHaveTransaction = isPaid && estimatedCost > 0
    
    if (shouldHaveTransaction) {
      // Upsert transaction
      const transactionData = {
        description: `Manutenção - ${maintenance.vehicle.plate} - ${maintenance.category}`,
        type: "SAIDA" as const,
        category: "Manutenção de Veículos",
        valueInCents: estimatedCost,
        paymentMethod: paymentMethod || "TRANSFERENCIA",
        date: new Date(),
        supplierId: maintenance.supplierId
      }

      if (existingMaintenance.transaction) {
        // Update existing
        await prisma.financialTransaction.update({
          where: { id: existingMaintenance.transaction.id },
          data: transactionData
        })
      } else {
        // Create new
        await prisma.financialTransaction.create({
          data: {
            ...transactionData,
            maintenanceId: maintenance.id
          }
        })
      }
    } else {
      // If shouldn't have transaction but has one, delete it
      if (existingMaintenance.transaction) {
        await prisma.financialTransaction.delete({
          where: { id: existingMaintenance.transaction.id }
        })
      }
    }
    
    // --- Business Logic: Recurrence ---
    
    if (isCompleting && maintenance.isRecurrent) {
      // Calculation for next date/km
      let nextDate = null
      let newScheduledDate: Date | null = null

      if (maintenance.intervalDays) {
        const baseDate = maintenance.completedDate || new Date()
        nextDate = new Date(baseDate)
        nextDate.setDate(nextDate.getDate() + maintenance.intervalDays)
        newScheduledDate = nextDate
      }

      // If we have intervalDays, we have a date.
      // If we only have intervalKm, we might not have a date... 
      // Requirement usually mandates a date. Let's force a date if missing (e.g. 6 months) or keep null if schema allows?
      // Schema says scheduledDate is Date (not null). So we MUST have a date.
      
      if (!newScheduledDate) {
        // Fallback if only KM is set: estimate based on average usage? 
        // For now, let's default to 6 months if only KM is provided to avoid error
        const today = new Date()
        newScheduledDate = new Date(today.setMonth(today.getMonth() + 6))
      }

      if (maintenance.isRecurrent) {
        await prisma.maintenance.create({
          data: {
            vehicleId: id,
            type: maintenance.type,
            category: maintenance.category,
            description: maintenance.description,
            priority: maintenance.priority,
            estimatedCost: maintenance.estimatedCost,
            costCenter: maintenance.costCenter,
            supplierId: maintenance.supplierId,
            isRecurrent: true,
            intervalDays: maintenance.intervalDays,
            intervalKm: maintenance.intervalKm,
            scheduledDate: newScheduledDate,
            status: "PENDENTE"
          }
        })
      }
    }

    // Audit
    await createAuditLog({
      action: AuditAction.UPDATE,
      entity: "Maintenance",
      entityId: maintenance.id,
      oldData: existingMaintenance,
      newData: maintenance,
      userId: userId,
    })

    return NextResponse.json(maintenance)
  } catch (error) {
    console.error("Error updating maintenance:", error)
    return NextResponse.json({ error: "Erro ao atualizar manutenção" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; maintenanceId: string }> }
) {
  const userId = request.headers.get("x-user-id")
  if (!userId) {
    return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 })
  }
  
  const { maintenanceId } = await params

  try {
    const existingMaintenance = await prisma.maintenance.findUnique({
      where: { id: maintenanceId }
    })

    if (!existingMaintenance) {
      return NextResponse.json({ error: "Manutenção não encontrada" }, { status: 404 })
    }

    // Soft delete
    await prisma.maintenance.update({
      where: { id: maintenanceId },
      data: { active: false }
    })
    
    // Audit
    await createAuditLog({
      action: AuditAction.DELETE,
      entity: "Maintenance",
      entityId: maintenanceId,
      oldData: existingMaintenance,
      userId: userId,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting maintenance:", error)
    return NextResponse.json({ error: "Erro ao excluir manutenção" }, { status: 500 })
  }
}
