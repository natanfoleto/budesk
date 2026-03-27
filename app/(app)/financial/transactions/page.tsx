"use client"

import { ExpenseCategory, TransactionType } from "@prisma/client"
import { FilterX, Loader2,Plus } from "lucide-react"
import { useMemo, useState } from "react"

import { TransactionForm } from "@/components/financial/transaction-form"
import { TransactionsTable } from "@/components/financial/transactions-table"
import { SupplierSelect } from "@/components/suppliers/supplier-select"
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
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useCreateTransaction, useDeleteTransaction,useTransactions, useUpdateTransaction } from "@/hooks/use-financial"
import { EXPENSE_CATEGORY_LABELS } from "@/lib/constants"
import { Transaction } from "@/types/financial"

export default function TransactionsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null)
  
  // Filtros
  const [descriptionFilter, setDescriptionFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("TODOS")
  const [categoryFilter, setCategoryFilter] = useState("TODOS")
  const [supplierIdFilter, setSupplierIdFilter] = useState<string | null>(null)
  const [dateFilterType, setDateFilterType] = useState("ALL")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  
  const hasActiveFilters = 
    descriptionFilter !== "" || 
    typeFilter !== "TODOS" || 
    categoryFilter !== "TODOS" || 
    supplierIdFilter !== null || 
    dateFilterType !== "ALL" || 
    startDate !== "" || 
    endDate !== ""

  const filters = useMemo(() => {
    const params: Record<string, string> = {}
    if (descriptionFilter) params.description = descriptionFilter
    if (typeFilter !== "TODOS") params.type = typeFilter
    if (categoryFilter !== "TODOS") params.category = categoryFilter
    if (supplierIdFilter) params.supplierId = supplierIdFilter
    
    if (dateFilterType === "SPECIFIC" && startDate) {
      params.startDate = startDate
      params.endDate = startDate
    } else if (dateFilterType === "RANGE") {
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate
    }
    return params
  }, [descriptionFilter, typeFilter, categoryFilter, supplierIdFilter, dateFilterType, startDate, endDate])

  const { data: transactions, isLoading } = useTransactions(filters)
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

      <Card className="relative overflow-visible">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input 
                placeholder="Filtrar por descrição" 
                value={descriptionFilter} 
                onChange={e => setDescriptionFilter(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  <SelectItem value={TransactionType.ENTRADA}>Entrada</SelectItem>
                  <SelectItem value={TransactionType.SAIDA}>Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todas</SelectItem>
                  {Object.values(ExpenseCategory).map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {EXPENSE_CATEGORY_LABELS[cat as ExpenseCategory]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fornecedor</Label>
              <SupplierSelect 
                value={supplierIdFilter} 
                onChange={setSupplierIdFilter} 
              />
            </div>

            <div className="space-y-2">
              <Label>Período</Label>
              <Select value={dateFilterType} onValueChange={setDateFilterType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas as datas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas as datas</SelectItem>
                  <SelectItem value="SPECIFIC">Dia específico</SelectItem>
                  <SelectItem value="RANGE">Período</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(dateFilterType === "SPECIFIC" || dateFilterType === "RANGE") && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4 items-end">
              {dateFilterType === "SPECIFIC" && (
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
              )}

              {dateFilterType === "RANGE" && (
                <>
                  <div className="space-y-2">
                    <Label>De</Label>
                    <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Até</Label>
                    <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>

        {hasActiveFilters && (
          <div className="absolute -top-4 left-1/2 z-10 -translate-x-1/2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => {
                      setDescriptionFilter("")
                      setTypeFilter("TODOS")
                      setCategoryFilter("TODOS")
                      setSupplierIdFilter(null)
                      setDateFilterType("ALL")
                      setStartDate("")
                      setEndDate("")
                    }}
                    className="h-8 w-8 rounded-full border bg-background shadow-xs hover:bg-accent"
                  >
                    <FilterX className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Limpar filtros</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </Card>

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
