"use client"

import { useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { SecureActionDialog } from "@/components/employees/secure-action-dialog"
import { PaymentForm } from "@/components/rh/payment-form"
import { PaymentsTable } from "@/components/rh/payments-table"
import { Button } from "@/components/ui/button"
import {
  useCreateRHPayment,
  useDeleteRHPayment,
  useRHPayments,
  useUpdateRHPayment,
} from "@/hooks/use-rh"
import { RHPayment, RHPaymentFormData } from "@/types/rh"

export default function PaymentsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState<RHPayment | null>(null)
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null)

  const { data: payments } = useRHPayments({})
  const createMutation = useCreateRHPayment()
  const updateMutation = useUpdateRHPayment(editingPayment?.id || "")
  const deleteMutation = useDeleteRHPayment()

  const queryClient = useQueryClient()

  const handleOpenCreate = () => {
    setEditingPayment(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (payment: RHPayment) => {
    setEditingPayment(payment)
    setIsFormOpen(true)
  }

  const handleConfirmPay = async (payment: RHPayment) => {
    try {
      const { updateRHPayment } = await import("@/lib/services/rh")
      await updateRHPayment(payment.id, { status: "PAGO", dataPagamento: new Date().toISOString() })
      queryClient.invalidateQueries({ queryKey: ["rh-payments"] })
      toast.success("Pagamento confirmado!")
    } catch {
      toast.error("Erro ao confirmar pagamento")
    }
  }

  const handleSubmit = (data: RHPaymentFormData) => {
    if (editingPayment) {
      updateMutation.mutate(data, {
        onSuccess: () => setIsFormOpen(false),
      })
    } else {
      createMutation.mutate(data, {
        onSuccess: () => setIsFormOpen(false),
      })
    }
  }

  const handleDelete = (id: string) => {
    setPaymentToDelete(id)
  }

  const confirmDelete = async () => {
    if (paymentToDelete) {
      deleteMutation.mutate(paymentToDelete, {
        onSuccess: () => setPaymentToDelete(null),
      })
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pagamentos de RH</h2>
          <p className="text-muted-foreground">Folha de pagamento, diárias, bônus e adiantamentos.</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" /> Novo Pagamento
        </Button>
      </div>

      <PaymentsTable
        payments={payments || []}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
        onConfirm={(p) => handleConfirmPay(p)}
      />

      <PaymentForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        initialData={editingPayment}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <SecureActionDialog
        open={!!paymentToDelete}
        onOpenChange={(open) => !open && setPaymentToDelete(null)}
        title="Excluir Pagamento"
        description="Se o pagamento já tiver sido confirmado, a transação de saída no fluxo de caixa também será revertida. Isso impactará os saldos. Tem certeza?"
        onConfirm={confirmDelete}
      />
    </div>
  )
}
