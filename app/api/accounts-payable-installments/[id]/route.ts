import { ExpenseCategory, PaymentMethod, Prisma } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"

import prisma from "@/lib/prisma"
import { AuditService } from "@/src/modules/audit/services/AuditService"
import { FinanceService } from "@/src/modules/finance/services/FinanceService"

const AUDIT_UPDATE = "UPDATE"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const userId = request.headers.get("x-user-id")

  try {
    const body = await request.json()
    const { status, paymentDate } = body

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const installment = await tx.accountInstallment.findUnique({
        where: { id },
        include: { 
          account: true,
          transaction: true
        }
      })

      if (!installment) {
        throw new Error("Parcela não encontrada")
      }

      const oldData = { ...installment }

      if (status === "PAGA") {
        // Registrar transação financeira
        const transaction = await FinanceService.registerTransaction(tx, {
          type: "SAIDA",
          category: ExpenseCategory.OUTROS,
          amountInCents: installment.valueInCents,
          paymentMethod: (installment.account.paymentMethod as PaymentMethod) || "BOLETO",
          description: `Pagamento Parcela ${installment.installmentNumber}/${installment.account.installmentsCount} - ${installment.account.description}`,
          date: paymentDate ? new Date(paymentDate) : new Date(),
          costCenterId: installment.account.costCenterId,
          supplierId: installment.account.supplierId,
          referenceId: installment.account.supplierId,
          referenceType: installment.account.supplierId ? "supplier" : undefined,
          userId: userId
        })

        const updatedInstallment = await tx.accountInstallment.update({
          where: { id },
          data: {
            status: "PAGA",
            paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
            transactionId: transaction.id
          }
        })

        await AuditService.logAction(tx, AUDIT_UPDATE, "AccountInstallment", id, updatedInstallment, userId || null, oldData)
        
        return updatedInstallment
      } else if (status === "PENDENTE") {
        // Reverter pagamento
        if (installment.transactionId) {
          await tx.financialTransaction.delete({
            where: { id: installment.transactionId }
          })
        }

        const updatedInstallment = await tx.accountInstallment.update({
          where: { id },
          data: {
            status: "PENDENTE",
            paymentDate: null,
            transactionId: null
          }
        })

        await AuditService.logAction(tx, AUDIT_UPDATE, "AccountInstallment", id, updatedInstallment, userId || null, oldData)

        return updatedInstallment
      }

      return installment
    })

    return NextResponse.json(result)
  } catch (error: unknown) {
    console.error(error)
    const errorMessage = error instanceof Error ? error.message : "Erro ao atualizar parcela"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
