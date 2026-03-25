"use client"

import { FilterX, Loader2, Plus } from "lucide-react"
import { useMemo, useState } from "react"

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
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAccountsPayable, useCreateAccountPayable, useDeleteAccountPayable, useUpdateAccountPayable } from "@/hooks/use-financial"
import { AccountPayable } from "@/types/financial"

export default function PayablesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<AccountPayable | null>(null)
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null)

  const [statusFilter, setStatusFilter] = useState("TODOS")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("TODOS")
  const [dateFilterType, setDateFilterType] = useState("ALL") 
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const filters = useMemo(() => {
    const params: Record<string, string> = {}
    if (statusFilter !== "TODOS") params.status = statusFilter
    if (paymentMethodFilter !== "TODOS") params.paymentMethod = paymentMethodFilter
    
    if (dateFilterType === "SPECIFIC" && startDate) {
      params.startDate = startDate
      params.endDate = startDate
    } else if (dateFilterType === "RANGE") {
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate
    }
    return params
  }, [statusFilter, paymentMethodFilter, dateFilterType, startDate, endDate])

  const { data: accounts, isLoading } = useAccountsPayable(filters)
  const createMutation = useCreateAccountPayable()
  const updateMutation = useUpdateAccountPayable()
  const deleteMutation = useDeleteAccountPayable()

  const handleCreate = (data: Record<string, unknown>) => {
    createMutation.mutate(data, {
      onSuccess: () => setIsFormOpen(false),
    })
  }

  const handleUpdate = (data: Record<string, unknown>) => {
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
          <Plus className="size-4 mr-2" /> Nova Conta
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  <SelectItem value="PENDENTE">Pendente</SelectItem>
                  <SelectItem value="PAGA">Paga</SelectItem>
                  <SelectItem value="ATRASADA">Atrasada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  <SelectItem value="BOLETO">Boleto</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                  <SelectItem value="CARTAO">Cartão</SelectItem>
                  <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                  <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
                  <SelectItem value="PIX">PIX</SelectItem>
                </SelectContent>
              </Select>
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

            <Button
              variant="outline"
              onClick={() => {
                setStatusFilter("TODOS")
                setPaymentMethodFilter("TODOS")
                setDateFilterType("ALL")
                setStartDate("")
                setEndDate("")
              }}
              className="text-muted-foreground w-full"
            >
              <FilterX className="h-4 w-4 mr-2" /> Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

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
