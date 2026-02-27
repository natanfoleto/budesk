"use client"

import { useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { SecureActionDialog } from "@/components/employees/secure-action-dialog"
import { VacationForm } from "@/components/rh/vacation-form"
import { VacationsTable } from "@/components/rh/vacations-table"
import { Button } from "@/components/ui/button"
import {
  useCreateVacation,
  useDeleteVacation,
  useUpdateVacation,
  useVacations,
} from "@/hooks/use-rh"
import { Vacation, VacationFormData } from "@/types/rh"

export default function VacationsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingVacation, setEditingVacation] = useState<Vacation | null>(null)
  const [vacationToDelete, setVacationToDelete] = useState<string | null>(null)

  const { data: vacations } = useVacations()
  const createMutation = useCreateVacation()
  const updateMutation = useUpdateVacation(editingVacation?.id || "")
  const deleteMutation = useDeleteVacation()

  const queryClient = useQueryClient()

  const handleOpenCreate = () => {
    setEditingVacation(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (vacation: Vacation) => {
    setEditingVacation(vacation)
    setIsFormOpen(true)
  }

  const handleConfirmPay = async (vacation: Vacation) => {
    if (!vacation.valorFerias) {
      toast.error("É necessário ter um valor bruto preenchido para pagar")
      return
    }

    try {
      const { updateVacation } = await import("@/lib/services/rh")
      await updateVacation(vacation.id, { status: "PAGA", valorFerias: vacation.valorFerias })
      queryClient.invalidateQueries({ queryKey: ["rh-vacations"] })
      toast.success("Férias pagas com sucesso!")
    } catch {
      toast.error("Erro ao confirmar pagamento das férias")
    }
  }

  const handleSubmit = (data: VacationFormData) => {
    if (editingVacation) {
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
    setVacationToDelete(id)
  }

  const confirmDelete = async () => {
    if (vacationToDelete) {
      deleteMutation.mutate(vacationToDelete, {
        onSuccess: () => setVacationToDelete(null),
      })
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Férias</h2>
          <p className="text-muted-foreground">Gestão de períodos aquisitivos, concessivos e pagamentos.</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4" /> Registrar Férias
        </Button>
      </div>

      <VacationsTable
        vacations={vacations || []}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
        onConfirmPayment={handleConfirmPay}
      />

      <VacationForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        initialData={editingVacation}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <SecureActionDialog
        open={!!vacationToDelete}
        onOpenChange={(open) => !open && setVacationToDelete(null)}
        title="Excluir Registro de Férias"
        description="Esta ação removerá o registro. Atenção: pagamentos de férias já gerados no financeiro deverão ser removidos manualmente e separadamente se for o caso desta exclusão retroativa. Tem certeza?"
        onConfirm={confirmDelete}
      />
    </div>
  )
}
