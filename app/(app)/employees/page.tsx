"use client"

import { Plus, Loader2 } from "lucide-react"
import { useState } from "react"

import { EmployeeForm } from "@/components/employees/employee-form"
import { EmployeesTable } from "@/components/employees/employees-table"
import { Button } from "@/components/ui/button"
import { useCreateEmployee, useDeleteEmployee, useEmployees } from "@/hooks/use-employees"
import { EmployeeFormData } from "@/types/employee"

export default function EmployeesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  
  const { data: employees, isLoading } = useEmployees()
  const createMutation = useCreateEmployee()
  const deleteMutation = useDeleteEmployee()

  const handleCreate = (data: EmployeeFormData) => {
    createMutation.mutate(data, {
      onSuccess: () => setIsFormOpen(false),
    })
  }

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este funcionário?")) {
      deleteMutation.mutate(id)
    }
  }

  const openCreate = () => {
    setIsFormOpen(true)
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Funcionários</h2>
        <Button onClick={openCreate} className="cursor-pointer">
          <Plus className="mr-2 h-4 w-4" /> Novo Funcionário
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-full w-full py-10">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <EmployeesTable
          employees={employees || []}
          onDelete={handleDelete}
        />
      )}

      <EmployeeForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleCreate}
        isLoading={createMutation.isPending}
      />
    </div>
  )
}
