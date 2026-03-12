"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus, Trash } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"


type Expense = {
  id: string
  date: string
  itemDescription: string
  invoiceNumber: string | null
  quantity: number
  unitValueInCents: number
  totalValueInCents: number
  notes: string | null
  isClosed: boolean
  vehicle?: { name: string; plate: string }
  front?: { name: string }
}

export default function PlantingExpensesPage() {
  const queryClient = useQueryClient()
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [expenseForm, setExpenseForm] = useState<Partial<Expense> & { vehicleId?: string, frontId?: string }>({
    date: new Date().toISOString().split("T")[0],
    quantity: 1,
    unitValueInCents: 0,
  })

  // Data fetching
  const { data: seasons } = useQuery({
    queryKey: ["plantingSeasons"],
    queryFn: async () => {
      const res = await fetch("/api/planting/seasons")
      return res.json()
    }
  })

  const { data: fronts } = useQuery({
    queryKey: ["workFronts", selectedSeasonId],
    queryFn: async () => {
      if (!selectedSeasonId || selectedSeasonId === "all") return []
      const res = await fetch(`/api/planting/work-fronts?seasonId=${selectedSeasonId}`)
      return res.json()
    },
    enabled: selectedSeasonId !== "all"
  })

  const { data: vehicles } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const res = await fetch("/api/vehicles")
      if(!res.ok) return []
      return res.json()
    }
  })

  const filterUrl = selectedSeasonId !== "all" ? `/api/planting/expenses?seasonId=${selectedSeasonId}` : `/api/planting/expenses`
  const { data: expenses, isLoading } = useQuery({
    queryKey: ["plantingExpenses", selectedSeasonId],
    queryFn: async () => {
      const res = await fetch(filterUrl)
      if (!res.ok) throw new Error("Failed to fetch expenses")
      return res.json() as Promise<Expense[]>
    }
  })

  // Mutations
  const createExpenseMutation = useMutation({
    mutationFn: async (payload: { seasonId: string; frontId: string; vehicleId?: string; date: string; itemDescription: string; invoiceNumber?: string | null; quantity: number; unitValueInCents: number; notes?: string | null }) => {
      const res = await fetch("/api/planting/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to create expense")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plantingExpenses"] })
      queryClient.invalidateQueries({ queryKey: ["plantingDashboard"] })
      setIsModalOpen(false)
      setExpenseForm({ date: new Date().toISOString().split("T")[0], quantity: 1, unitValueInCents: 0 })
      toast.success("Gasto registrado com sucesso.")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/planting/expenses?id=${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete expense")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plantingExpenses"] })
      toast.success("Registro removido.")
    }
  })

  // Handlers
  const handleSaveExpense = () => {
    // Basic validation
    if (!expenseForm.date || !expenseForm.itemDescription || !expenseForm.frontId) {
      toast.error("Preencha Frente, Data e Descrição do Item.")
      return
    }

    const payload = {
      seasonId: selectedSeasonId,
      frontId: expenseForm.frontId,
      vehicleId: expenseForm.vehicleId,
      date: new Date(expenseForm.date as string).toISOString(),
      itemDescription: expenseForm.itemDescription,
      invoiceNumber: expenseForm.invoiceNumber,
      quantity: Number(expenseForm.quantity),
      unitValueInCents: Math.round(Number(expenseForm.unitValueInCents) * 100),
      notes: expenseForm.notes
    }

    createExpenseMutation.mutate(payload)
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100)
  }

  // Calculated total for form
  const formTotal = (Number(expenseForm.quantity || 0) * Number(expenseForm.unitValueInCents || 0)).toFixed(2)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gastos Operacionais</h2>
          <p className="text-muted-foreground">
            Lançamento de despesas como diesel, peças e serviços vinculados ao plantio.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por Safra" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Safras</SelectItem>
              {seasons?.map((season: { id: string; name: string }) => (
                <SelectItem key={season.id} value={season.id}>
                  {season.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button disabled={selectedSeasonId === "all"}>
                <Plus className="mr-2 h-4 w-4" /> Novo Gasto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Lançar Despesa Operacional</DialogTitle>
                <DialogDescription>
                  Este lançamento gerará uma saída no módulo Financeiro automaticamente.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">Data</Label>
                  <Input id="date" type="date" value={expenseForm.date} onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})} className="col-span-3" />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="front" className="text-right">Frente</Label>
                  <Select value={expenseForm.frontId} onValueChange={(v) => setExpenseForm({...expenseForm, frontId: v})}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione a frente" />
                    </SelectTrigger>
                    <SelectContent>
                      {fronts?.map((front: { id: string; name: string }) => (
                        <SelectItem key={front.id} value={front.id}>{front.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="item" className="text-right">Item/Serviço</Label>
                  <Input id="item" placeholder="Ex: Óleo Diesel S10" value={expenseForm.itemDescription || ""} onChange={(e) => setExpenseForm({...expenseForm, itemDescription: e.target.value})} className="col-span-3" />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="invoice" className="text-right">NF/Recibo</Label>
                  <Input id="invoice" placeholder="Opcional" value={expenseForm.invoiceNumber || ""} onChange={(e) => setExpenseForm({...expenseForm, invoiceNumber: e.target.value})} className="col-span-3" />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="vehicle" className="text-right">Veículo</Label>
                  <Select value={expenseForm.vehicleId} onValueChange={(v) => setExpenseForm({...expenseForm, vehicleId: v})}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Opcional (se for frota)" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles?.map((v: { id: string; name: string; plate: string }) => (
                        <SelectItem key={v.id} value={v.id}>{v.name} ({v.plate})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-[1fr_1fr_1fr] gap-4">
                  <div>
                    <Label htmlFor="qty">Quant.</Label>
                    <Input id="qty" type="number" step="0.01" value={expenseForm.quantity} onChange={(e) => setExpenseForm({...expenseForm, quantity: Number(e.target.value)})} />
                  </div>
                  <div>
                    <Label htmlFor="unit">Valor Unit.</Label>
                    <Input id="unit" type="number" step="0.01" value={expenseForm.unitValueInCents} onChange={(e) => setExpenseForm({...expenseForm, unitValueInCents: Number(e.target.value)})} />
                  </div>
                  <div>
                    <Label htmlFor="total">Total</Label>
                    <Input id="total" value={`R$ ${formTotal}`} disabled className="bg-muted font-bold" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSaveExpense} disabled={createExpenseMutation.isPending}>
                  Confirmar Lançamento
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>NF</TableHead>
                <TableHead>Frente</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead className="text-right">Quant.</TableHead>
                <TableHead className="text-right">Valor Extenso</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                ))
              ) : expenses?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    Nenhum lançamento encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                expenses?.map((expense) => (
                  <TableRow key={expense.id} className={expense.isClosed ? "bg-muted/30" : ""}>
                    <TableCell>{new Date(expense.date).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="font-medium">{expense.itemDescription}</TableCell>
                    <TableCell>{expense.invoiceNumber || "-"}</TableCell>
                    <TableCell>{expense.front?.name || "-"}</TableCell>
                    <TableCell>{expense.vehicle?.plate || "-"}</TableCell>
                    <TableCell className="text-right">{expense.quantity}</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(expense.totalValueInCents)}</TableCell>
                    <TableCell>
                      {!expense.isClosed && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if(confirm("Tem certeza que deseja remover este gasto? A transação financeira também será removida.")) {
                              deleteExpenseMutation.mutate(expense.id)
                            }
                          }}
                        >
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
