"use client"

import { useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { SecureActionDialog } from "@/components/employees/secure-action-dialog"
import { ThirteenthForm } from "@/components/rh/thirteenth-form"
import { ThirteenthTable } from "@/components/rh/thirteenth-table"
import { Button } from "@/components/ui/button"
import {
  useCreateThirteenth,
  useDeleteThirteenth,
  useThirteenths,
} from "@/hooks/use-rh"
import { ThirteenthFormData, ThirteenthSalary } from "@/types/rh"

export default function ThirteenthPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null)

  const { data: records } = useThirteenths()
  const createMutation = useCreateThirteenth()
  const deleteMutation = useDeleteThirteenth()
  const queryClient = useQueryClient()

  const handleOpenCreate = () => setIsFormOpen(true)

  const handleSubmit = (data: ThirteenthFormData) => {
    createMutation.mutate(data, {
      onSuccess: () => setIsFormOpen(false),
    })
  }

  const handleDelete = (id: string) => {
    setRecordToDelete(id)
  }

  const confirmDelete = async () => {
    if (recordToDelete) {
      deleteMutation.mutate(recordToDelete, {
        onSuccess: () => setRecordToDelete(null),
      })
    }
  }

  const handleToggleParcela = async (record: ThirteenthSalary, isPrimeira: boolean) => {
    const payload: Partial<ThirteenthSalary> = {}
    if (isPrimeira) {
      payload.primeiraPaga = true
      payload.primeiraParcela = Number(record.valorTotal) / 2
    } else {
      payload.segundaPaga = true
      payload.segundaParcela = Number(record.valorTotal) / 2
    }

    try {
      const { updateThirteenth } = await import("@/lib/services/rh")
      await updateThirteenth(record.id, payload)
      queryClient.invalidateQueries({ queryKey: ["rh-thirteenths"] })
      toast.success("Parcela paga com sucesso!")
    } catch {
      toast.error("Erro ao pagar parcela")
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">13º Salário</h2>
          <p className="text-muted-foreground">Provisões e pagamentos da primeira e segunda parcelas.</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" /> Gerar 13º Salário
        </Button>
      </div>

      <ThirteenthTable
        records={records || []}
        onDelete={handleDelete}
        onToggleParcela={handleToggleParcela}
      />

      <ThirteenthForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending}
      />

      <SecureActionDialog
        open={!!recordToDelete}
        onOpenChange={(open) => !open && setRecordToDelete(null)}
        title="Excluir Registro de 13º"
        description="Esta ação removerá o registro. Transações de caixa geradas para parcelas pagas deverão ser removidas ou revertidas manualmente. Tem certeza?"
        onConfirm={confirmDelete}
      />
    </div>
  )
}
