import { AccountStatus, Prisma } from "@prisma/client"
import { addMonths } from "date-fns"
import { NextRequest, NextResponse } from "next/server"

import prisma from "@/lib/prisma"
import { AuditService } from "@/src/modules/audit/services/AuditService"

const AUDIT_UPDATE = "UPDATE"
const AUDIT_DELETE = "DELETE"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const account = await prisma.accountPayable.findUnique({
      where: { id },
      include: {
        supplier: true,
        installments: {
          orderBy: { installmentNumber: "asc" }
        }
      }
    })

    if (!account) {
      return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 })
    }

    return NextResponse.json(account)
  } catch {
    return NextResponse.json({ error: "Erro ao buscar conta" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const userId = request.headers.get("x-user-id")

  try {
    const body = await request.json()
    const { 
      description, 
      supplierId, 
      costCenterId, 
      paymentMethod, 
      totalValueInCents, 
      installmentsCount, 
      firstDueDate,
      attachmentUrl,
      invoiceUrl
    } = body

    const oldData = await prisma.accountPayable.findUnique({ 
      where: { id },
      include: { installments: { orderBy: { installmentNumber: "asc" } } }
    })

    if (!oldData) {
      return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 })
    }

    const paidInstallments = oldData.installments.filter(i => i.status === "PAGA")
    const paidSum = paidInstallments.reduce((sum, i) => sum + i.valueInCents, 0)

    const newTotalValue = totalValueInCents ?? oldData.totalValueInCents
    const newInstallmentsCount = installmentsCount ?? oldData.installmentsCount

    if (newTotalValue < paidSum) {
      return NextResponse.json({ error: "O novo valor não pode ser menor que o total já pago." }, { status: 400 })
    }

    if (newInstallmentsCount < paidInstallments.length) {
      return NextResponse.json({ error: "O número de parcelas não pode ser menor que as já pagas." }, { status: 400 })
    }

    const updatedAccount = await prisma.$transaction(async (tx) => {
      await tx.accountPayable.update({
        where: { id },
        data: {
          description,
          supplierId: supplierId || null,
          costCenterId: costCenterId || null,
          paymentMethod,
          totalValueInCents: newTotalValue,
          installmentsCount: newInstallmentsCount,
          attachmentUrl: attachmentUrl !== undefined ? attachmentUrl : oldData.attachmentUrl,
          invoiceUrl: invoiceUrl !== undefined ? invoiceUrl : oldData.invoiceUrl,
        },
      })

      const valueChanged = newTotalValue !== oldData.totalValueInCents
      const countChanged = newInstallmentsCount !== oldData.installmentsCount
      const dateChanged = firstDueDate && oldData.installments[0]?.dueDate && 
        new Date(firstDueDate).toISOString().split("T")[0] !== new Date(oldData.installments[0].dueDate).toISOString().split("T")[0]

      if (valueChanged || countChanged || dateChanged) {
        await tx.accountInstallment.deleteMany({
          where: { 
            accountPayableId: id,
            status: { in: ["PENDENTE", "ATRASADA"] }
          }
        })

        const remainingValue = newTotalValue - paidSum
        const remainingCount = newInstallmentsCount - paidInstallments.length

        if (remainingCount > 0) {
          const installmentBaseValue = Math.floor(remainingValue / remainingCount)
          const remainder = remainingValue - (installmentBaseValue * remainingCount)

          const startDate = firstDueDate ? new Date(firstDueDate) : new Date(oldData.installments[0]?.dueDate || new Date())
          
          const newInstallmentsData = []
          const startingIndex = paidInstallments.length + 1

          for (let i = 1; i <= remainingCount; i++) {
            const currentInstallmentNumber = startingIndex + i - 1
            const value = i === remainingCount ? installmentBaseValue + remainder : installmentBaseValue
            const dueDate = addMonths(startDate, currentInstallmentNumber - 1)

            newInstallmentsData.push({
              accountPayableId: id,
              installmentNumber: currentInstallmentNumber,
              valueInCents: value,
              dueDate: dueDate,
              status: "PENDENTE" as AccountStatus,
            })
          }

          if (newInstallmentsData.length > 0) {
            await tx.accountInstallment.createMany({
              data: newInstallmentsData
            })
          }
        }
      }

      return await tx.accountPayable.findUnique({
        where: { id },
        include: { installments: { orderBy: { installmentNumber: "asc" } } }
      })
    })

    if (!updatedAccount) {
      return NextResponse.json({ error: "Erro ao recuperar conta atualizada" }, { status: 500 })
    }

    await AuditService.logAction(prisma, AUDIT_UPDATE, "AccountPayable", updatedAccount.id, updatedAccount as unknown as Prisma.InputJsonValue, userId || null, oldData as unknown as Prisma.InputJsonValue)

    return NextResponse.json(updatedAccount)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao atualizar conta" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const userId = request.headers.get("x-user-id")

  try {
    const oldData = await prisma.accountPayable.findUnique({ where: { id } })

    if (!oldData) {
      return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 })
    }

    await prisma.accountPayable.delete({
      where: { id },
    })

    await AuditService.logAction(prisma, AUDIT_DELETE, "AccountPayable", id, oldData, userId || null)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao excluir conta" }, { status: 500 })
  }
}
