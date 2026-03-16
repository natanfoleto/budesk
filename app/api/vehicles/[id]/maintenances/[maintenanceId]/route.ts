import { AuditAction, ExpenseCategory, Prisma } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"

import { maintenanceSchema } from "@/components/fleet/maintenance-schema"
import prisma from "@/lib/prisma"
import { AuditService } from "@/src/modules/audit/services/AuditService"
import { FinanceService } from "@/src/modules/finance/services/FinanceService"


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
    const updateData: Prisma.MaintenanceUncheckedUpdateInput = {
      type, category, description, priority,
      scheduledDate: new Date(scheduledDate),
      isRecurrent, 
      intervalKm,
      intervalDays,
      isPaid,
      estimatedCost,
      finalCost,
      costCenterId: costCenter || undefined, // Mapped to new field
      supplierId,
      invoiceNumber,
      status, 
      internalNotes, 
      approvalResponsible, 
      operationalImpact,
      downtimeDays,
      completedDate: completedDate ? new Date(completedDate) : null,
      currentKm,
    }

    if (isCompleting) {
      if (!updateData.completedDate) updateData.completedDate = new Date()
      if (updateData.finalCost === null || updateData.finalCost === undefined) {
        updateData.finalCost = updateData.estimatedCost
      }
    }

    if (isRollingBack) {
      updateData.completedDate = null
      updateData.finalCost = null
    }

    const result = await prisma.$transaction(async (tx) => {
      // Execute Update
      const maintenance = await tx.maintenance.update({
        where: { id: maintenanceId },
        data: updateData,
        include: {
          vehicle: true
        }
      })

      // --- Business Logic: Financials ---
      const shouldHaveTransaction = isPaid && estimatedCost > 0
      
      if (shouldHaveTransaction) {
        // Upsert transaction logic is centralized via FinanceService, but FinanceService creates it.
        // If we update, we either replace or update. Using the existing relation is safer.
        const transactionData = {
          description: `Manutenção - ${maintenance.vehicle.plate} - ${maintenance.category}`,
          type: "SAIDA" as const,
          category: ExpenseCategory.MANUTENCAO,
          valueInCents: estimatedCost,
          paymentMethod: paymentMethod || "TRANSFERENCIA",
          date: new Date(),
          supplierId: maintenance.supplierId,
          costCenterId: maintenance.costCenterId
        }

        if (existingMaintenance.transaction) {
          // Update existing directly for simplicity on upserts
          await tx.financialTransaction.update({
            where: { id: existingMaintenance.transaction.id },
            data: transactionData
          })
        } else {
          // Create new via Service
          await FinanceService.registerTransaction(tx, {
            ...transactionData,
            amountInCents: transactionData.valueInCents,
            referenceId: maintenance.id,
            referenceType: "maintenance",
            userId
          })
        }
      } else {
        // If shouldn't have transaction but has one, delete it
        if (existingMaintenance.transaction) {
          await tx.financialTransaction.delete({
            where: { id: existingMaintenance.transaction.id }
          })
        }
      }
      
      // --- Business Logic: Recurrence ---
      if (isCompleting && maintenance.isRecurrent) {
        let nextDate = null
        let newScheduledDate: Date | null = null

        if (maintenance.intervalDays) {
          const baseDate = maintenance.completedDate || new Date()
          nextDate = new Date(baseDate)
          nextDate.setDate(nextDate.getDate() + maintenance.intervalDays)
          newScheduledDate = nextDate
        }

        if (!newScheduledDate) {
          const today = new Date()
          newScheduledDate = new Date(today.setMonth(today.getMonth() + 6))
        }

        if (maintenance.isRecurrent) {
          await tx.maintenance.create({
            data: {
              vehicleId: id,
              type: maintenance.type,
              category: maintenance.category,
              description: maintenance.description,
              priority: maintenance.priority,
              estimatedCost: maintenance.estimatedCost,
              costCenterId: maintenance.costCenterId, // New mapped field
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

      await AuditService.logAction(tx, AuditAction.UPDATE, "Maintenance", maintenance.id, maintenance, userId, existingMaintenance)
      
      return maintenance
    })

    return NextResponse.json(result)
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

    await prisma.$transaction(async (tx) => {
      // Soft delete
      const maintenance = await tx.maintenance.update({
        where: { id: maintenanceId },
        data: { active: false }
      })
      
      // If there's a payment/transaction, we might need to rollback.
      // Easiest is to just log deletion.
      await AuditService.logAction(tx, AuditAction.DELETE, "Maintenance", maintenanceId, undefined, userId, existingMaintenance)
      
      return maintenance
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting maintenance:", error)
    return NextResponse.json({ error: "Erro ao excluir manutenção" }, { status: 500 })
  }
}
