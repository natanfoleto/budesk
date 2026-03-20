"use client"

import { Loader2,Plus } from "lucide-react"
import { useState } from "react"

import { TransactionForm } from "@/components/financial/transaction-form"
import { TransactionsTable } from "@/components/financial/transactions-table"
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
import { useCreateTransaction, useDeleteTransaction,useTransactions, useUpdateTransaction } from "@/hooks/use-financial"
import { Transaction } from "@/types/financial"

export default function TransactionsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null)
  
  const { data: transactions, isLoading } = useTransactions()
  const createMutation = useCreateTransaction()
  const updateMutation = useUpdateTransaction()
  const deleteMutation = useDeleteTransaction()

  const handleCreate = (data: Omit<Transaction, "id" | "createdAt" | "updatedAt">) => {
    createMutation.mutate(data, {
      onSuccess: () => setIsFormOpen(false),
    })
  }

  const handleUpdate = (data: Partial<Transaction>) => {
    if (editingTransaction) {
      updateMutation.mutate({ id: editingTransaction.id, data }, {
        onSuccess: () => {
          setIsFormOpen(false)
          setEditingTransaction(null)
        }
      })
    }
  }

  const handleDelete = (id: string) => {
    setTransactionToDelete(id)
  }

  const confirmDelete = () => {
    if (transactionToDelete) {
      deleteMutation.mutate(transactionToDelete, {
        onSuccess: () => setTransactionToDelete(null)
      })
    }
  }

  const openCreate = () => {
    setEditingTransaction(null)
    setIsFormOpen(true)
  }

  const openEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setIsFormOpen(true)
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Caixa</h2>
        <Button onClick={openCreate}>
          <Plus className="size-4" /> Nova Transação
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-full w-full py-10">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <TransactionsTable
          transactions={transactions || []}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}

      <TransactionForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open)
          if (!open) setEditingTransaction(null)
        }}
        onSubmit={editingTransaction ? handleUpdate : handleCreate}
        initialData={editingTransaction}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={!!transactionToDelete} onOpenChange={(open) => !open && setTransactionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A transação será removida permanentemente do caixa.
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
