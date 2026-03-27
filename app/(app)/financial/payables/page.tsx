"use client"

import { ExpenseCategory, PaymentMethod } from "@prisma/client"
import { FilterX, Loader2, Plus } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"

import { AccountPayableForm, AccountPayableFormData } from "@/components/financial/account-payable-form"
import { AccountsPayableTable } from "@/components/financial/accounts-payable-table"
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
import { Pagination } from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useAccountsPayable, useCreateAccountPayable, useDeleteAccountPayable, useUpdateAccountPayable } from "@/hooks/use-financial"
import { EXPENSE_CATEGORY_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/constants"
import { AccountPayable } from "@/types/financial"

export default function PayablesPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const page = Number(searchParams.get("page")) || 1
  const limit = Number(searchParams.get("limit")) || 10

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<AccountPayable | null>(null)
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null)

  const [statusFilter, setStatusFilter] = useState("TODOS")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("TODOS")
  const [categoryFilter, setCategoryFilter] = useState("TODOS")
  const [supplierIdFilter, setSupplierIdFilter] = useState<string | null>(null)
  const [dateFilterType, setDateFilterType] = useState("ALL") 
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  
  const hasActiveFilters = 
    statusFilter !== "TODOS" || 
    paymentMethodFilter !== "TODOS" || 
    categoryFilter !== "TODOS" || 
    supplierIdFilter !== null || 
    dateFilterType !== "ALL" || 
    startDate !== "" || 
    endDate !== ""

  const filters = useMemo(() => {
    const params: Record<string, string> = {
      page: String(page),
      limit: String(limit),
    }
    if (statusFilter !== "TODOS") params.status = statusFilter
    if (paymentMethodFilter !== "TODOS") params.paymentMethod = paymentMethodFilter
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
  }, [statusFilter, paymentMethodFilter, categoryFilter, supplierIdFilter, dateFilterType, startDate, endDate, page, limit])

  const { data: response, isLoading } = useAccountsPayable(filters)
  const createMutation = useCreateAccountPayable()
  const updateMutation = useUpdateAccountPayable()
  const deleteMutation = useDeleteAccountPayable()

  const handleCreate = (data: AccountPayableFormData) => {
    createMutation.mutate(data, {
      onSuccess: () => setIsFormOpen(false),
    })
  }

  const handleUpdate = (data: AccountPayableFormData) => {
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

  const updateFilters = (newFilters: Record<string, string | number | null | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "" || value === "TODOS" || value === "ALL") {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    })
    if (!newFilters.page && newFilters.page !== page) {
      params.delete("page")
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const clearFilters = () => {
    router.replace(pathname, { scroll: false })
    setStatusFilter("TODOS")
    setPaymentMethodFilter("TODOS")
    setCategoryFilter("TODOS")
    setSupplierIdFilter(null)
    setDateFilterType("ALL")
    setStartDate("")
    setEndDate("")
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Contas a Pagar</h2>
          <p className="text-muted-foreground">
            Gerencie suas contas a pagar, parcelas e anexos.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" /> Nova Conta
        </Button>
      </div>

      <Card className="relative overflow-visible">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={statusFilter} 
                onValueChange={(v) => {
                  setStatusFilter(v)
                  updateFilters({ status: v, page: 1 })
                }}
              >
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
              <Select 
                value={paymentMethodFilter} 
                onValueChange={(v) => {
                  setPaymentMethodFilter(v)
                  updateFilters({ paymentMethod: v, page: 1 })
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  {Object.values(PaymentMethod).map(method => (
                    <SelectItem key={method} value={method}>
                      {PAYMENT_METHOD_LABELS[method]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select 
                value={categoryFilter} 
                onValueChange={(v) => {
                  setCategoryFilter(v)
                  updateFilters({ category: v, page: 1 })
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todas</SelectItem>
                  {Object.values(ExpenseCategory).map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {EXPENSE_CATEGORY_LABELS[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fornecedor</Label>
              <SupplierSelect 
                value={supplierIdFilter} 
                onChange={(v) => {
                  setSupplierIdFilter(v)
                  updateFilters({ supplierId: v, page: 1 })
                }} 
              />
            </div>

            <div className="space-y-2">
              <Label>Período</Label>
              <Select 
                value={dateFilterType} 
                onValueChange={(v) => {
                  setDateFilterType(v)
                  updateFilters({ dateType: v, page: 1 })
                }}
              >
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
                  <Input 
                    type="date" 
                    value={startDate} 
                    onChange={e => {
                      setStartDate(e.target.value)
                      updateFilters({ startDate: e.target.value, page: 1 })
                    }} 
                  />
                </div>
              )}

              {dateFilterType === "RANGE" && (
                <>
                  <div className="space-y-2">
                    <Label>De</Label>
                    <Input 
                      type="date" 
                      value={startDate} 
                      onChange={e => {
                        setStartDate(e.target.value)
                        updateFilters({ startDate: e.target.value, page: 1 })
                      }} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Até</Label>
                    <Input 
                      type="date" 
                      value={endDate} 
                      onChange={e => {
                        setEndDate(e.target.value)
                        updateFilters({ endDate: e.target.value, page: 1 })
                      }} 
                    />
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
                    onClick={clearFilters}
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
        <div className="space-y-4">
          <AccountsPayableTable
            accounts={response?.data || []}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
          {response?.meta && (
            <Pagination
              meta={response.meta}
              onPageChange={(p: number) => updateFilters({ page: p })}
              onLimitChange={(l: number) => updateFilters({ limit: l, page: 1 })}
            />
          )}
        </div>
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
