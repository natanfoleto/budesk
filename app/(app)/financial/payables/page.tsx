"use client"

import { Loader2,Plus } from "lucide-react"
import { useState } from "react"

import { AccountPayableForm } from "@/components/financial/account-payable-form"
import { AccountsPayableTable } from "@/components/financial/accounts-payable-table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useAccountsPayable, useCreateAccountPayable, useDeleteAccountPayable,useUpdateAccountPayable } from "@/hooks/use-financial"
import { AccountPayable } from "@/types/financial"

export default function PayablesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<AccountPayable | null>(null)
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null)
  
  const { data: accounts, isLoading } = useAccountsPayable()
  const createMutation = useCreateAccountPayable()
  const updateMutation = useUpdateAccountPayable()
  const deleteMutation = useDeleteAccountPayable()

  const handleCreate = (data: Omit<AccountPayable, "id" | "createdAt" | "updatedAt">) => {
    createMutation.mutate(data, {
      onSuccess: () => setIsFormOpen(false),
    })
  }

  const handleUpdate = (data: Partial<AccountPayable>) => {
    if (editingAccount) {
      updateMutation.mutate({ id: editingAccount.id, data }, {
        onSuccess: () => {
          setIsFormOpen(false)
          setEditingAccount(null)
        }
      })
    }
  }

  const handleDelete = (id: string) => {
    setAccountToDelete(id)
  }

  const confirmDelete = () => {
    if (accountToDelete) {
      deleteMutation.mutate(accountToDelete, {
        onSuccess: () => setAccountToDelete(null)
      })
    }
  }

  const openCreate = () => {
    setEditingAccount(null)
    setIsFormOpen(true)
  }

  const openEdit = (account: AccountPayable) => {
    setEditingAccount(account)
    setIsFormOpen(true)
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Contas a Pagar</h2>
        <Button onClick={openCreate}>
          <Plus className="size-4" /> Nova Conta
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-full w-full py-10">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <AccountsPayableTable
          accounts={accounts || []}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}

      <AccountPayableForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open)
          if (!open) setEditingAccount(null)
        }}
        onSubmit={editingAccount ? handleUpdate : handleCreate}
        initialData={editingAccount}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={!!accountToDelete} onOpenChange={(open) => !open && setAccountToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A conta será removida permanentemente do financeiro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
