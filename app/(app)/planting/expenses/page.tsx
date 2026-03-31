"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ExpenseCategory } from "@prisma/client"
import { FilterX, Loader2, MoreHorizontal, Plus } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Suspense, useMemo, useState } from "react"
import { Resolver, SubmitHandler, useForm } from "react-hook-form"
import * as z from "zod"

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
import { Badge } from "@/components/ui/badge"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pagination } from "@/components/ui/pagination"
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  useCreateExpense,
  useDeleteExpense,
  usePlantingExpenses,
  usePlantingSeasons,
  useUpdateExpense,
  useWorkFronts,
} from "@/hooks/use-planting"
import { useVehicles } from "@/hooks/use-vehicles"
import { formatCentsToReal, formatCurrency } from "@/lib/utils"
import { PlantingExpense, PlantingExpenseFormData } from "@/types/planting"

const categoryLabels: Record<ExpenseCategory, string> = {
  [ExpenseCategory.ALIMENTACAO]: "Alimentação",
  [ExpenseCategory.COMBUSTIVEL]: "Combustível",
  [ExpenseCategory.EQUIPAMENTOS]: "Equipamentos",
  [ExpenseCategory.MANUTENCAO]: "Manutenção",
  [ExpenseCategory.PECAS]: "Peças",
  [ExpenseCategory.SALARIO]: "Salário",
  [ExpenseCategory.SERVICOS]: "Serviços",
  [ExpenseCategory.OUTROS]: "Outros",
}

const expenseSchema = z.object({
  date: z.string().min(1, "A data é obrigatória"),
  frontId: z.string().min(1, "Selecione uma frente de trabalho"),
  vehicleId: z.string().optional(),
  supplierId: z.string().optional(),
  category: z.nativeEnum(ExpenseCategory),
  itemDescription: z.string().min(1, "Informe a descrição do item/serviço"),
  invoiceNumber: z.string().optional(),
  quantity: z.coerce.number().min(0.01, "A quantidade deve ser maior que 0"),
  unitValue: z.number().min(0, "O valor unitário não pode ser negativo"),
})

type ExpenseFormValues = z.infer<typeof expenseSchema>

function ExpensesContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<PlantingExpense | null>(null)
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null)

  // URL Filters
  const selectedSeasonId = searchParams.get("seasonId") || "all"
  const selectedFrontId = searchParams.get("frontId") || "all"
  const page = Number(searchParams.get("page")) || 1
  const limit = Number(searchParams.get("limit")) || 10
  
  // Advanced Filters
  const supplierId = searchParams.get("supplierId") || "all"
  const category = searchParams.get("category") || "all"
  const vehicleId = searchParams.get("vehicleId") || "all"
  const dateType = searchParams.get("dateType") || "all"
  const month = searchParams.get("month") || new Date().toISOString().slice(0, 7)
  const fortnight = searchParams.get("fortnight") || "all"
  const startDate = searchParams.get("startDate") || ""
  const endDate = searchParams.get("endDate") || ""

  const hasActiveFilters = 
    supplierId !== "all" || 
    category !== "all" || 
    vehicleId !== "all" || 
    dateType !== "all" ||
    selectedFrontId !== "all"

  const updateFilters = (newFilters: Record<string, string | number | undefined | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "" || value === "all") {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    })
    // Reset page when filtering unless page is explicitly provided
    if (newFilters.page === undefined) {
      params.delete("page")
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const clearFilters = () => {
    const params = new URLSearchParams()
    if (selectedSeasonId !== "all") params.set("seasonId", selectedSeasonId)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  // Calculate dates based on filter type for the query
  const queryFilters = useMemo(() => {
    const filters: Record<string, unknown> = {
      seasonId: selectedSeasonId !== "all" ? selectedSeasonId : undefined,
      frontId: selectedFrontId !== "all" ? selectedFrontId : undefined,
      supplierId: supplierId !== "all" ? supplierId : undefined,
      category: category !== "all" ? category : undefined,
      vehicleId: vehicleId !== "all" ? vehicleId : undefined,
      page,
      limit,
    }

    if (dateType === "month" && month) {
      const [year, m] = month.split("-")
      filters.startDate = `${year}-${m}-01`
      filters.endDate = new Date(Number(year), Number(m), 0).toISOString().split("T")[0]
    } else if (dateType === "fortnight" && month && fortnight !== "all") {
      const [year, m] = month.split("-")
      if (fortnight === "1") {
        filters.startDate = `${year}-${m}-01`
        filters.endDate = `${year}-${m}-15`
      } else {
        filters.startDate = `${year}-${m}-16`
        filters.endDate = new Date(Number(year), Number(m), 0).toISOString().split("T")[0]
      }
    } else if (dateType === "range") {
      if (startDate) filters.startDate = startDate
      if (endDate) filters.endDate = endDate
    } else if (dateType === "specific" && startDate) {
      filters.date = startDate
    }

    return filters
  }, [selectedSeasonId, selectedFrontId, supplierId, category, vehicleId, dateType, month, fortnight, startDate, endDate, page, limit])

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema) as Resolver<ExpenseFormValues>,
    defaultValues: {
      date: new Date().toISOString().slice(0, 16),
      frontId: "",
      vehicleId: "",
      supplierId: "",
      category: ExpenseCategory.OUTROS,
      itemDescription: "",
      invoiceNumber: "",
      quantity: 1,
      unitValue: 0,
    },
  })

  // Queries
  const { data: seasons } = usePlantingSeasons()
  const effectiveSeasonId = editingExpense ? editingExpense.seasonId : (selectedSeasonId !== "all" ? selectedSeasonId : undefined)
  const { data: fronts } = useWorkFronts(effectiveSeasonId)
  const { data: response, isLoading } = usePlantingExpenses(queryFilters)

  // Vehicles fetch using shared hook
  const { data: vehiclesData } = useVehicles({ active: "true", limit: "100" })
  const vehicles = vehiclesData?.data || []

  // Mutations
  const createExpenseMutation = useCreateExpense()
  const deleteExpenseMutation = useDeleteExpense()
  const updateExpenseMutation = useUpdateExpense()

  const handleEditClick = (expense: PlantingExpense) => {
    let invoiceNumber = ""
    let itemDescription = expense.description
    
    // Extract invoice number if it was appended during creation
    const match = expense.description.match(/\(NF: (.*?)\)$/)
    if (match) {
      invoiceNumber = match[1]
      itemDescription = expense.description.replace(` (NF: ${invoiceNumber})`, "").trim()
    }

    setEditingExpense(expense)
    
    // Explicitly casting to match ExpenseFormValues
    const editValues: ExpenseFormValues = {
      date: new Date(expense.date).toISOString().slice(0, 16),
      frontId: expense.frontId || "",
      vehicleId: expense.vehicleId || "",
      supplierId: expense.supplierId || "",
      category: (expense.category as ExpenseCategory) || ExpenseCategory.OUTROS,
      itemDescription,
      invoiceNumber: invoiceNumber || "",
      quantity: Number(expense.quantity) || 1,
      unitValue: expense.unitValueInCents || Math.round((expense.totalValueInCents / (Number(expense.quantity) || 1))),
    }
    
    form.reset(editValues)
    setIsModalOpen(true)
  }

  const handleModalClose = (open: boolean) => {
    setIsModalOpen(open)
    if (!open) {
      setEditingExpense(null)
      form.reset({
        date: new Date().toISOString().slice(0, 16),
        frontId: selectedFrontId !== "all" ? selectedFrontId : "",
        vehicleId: "",
        supplierId: "",
        category: ExpenseCategory.OUTROS,
        itemDescription: "",
        invoiceNumber: "",
        quantity: 1,
        unitValue: 0,
      })
    } else if (!editingExpense) {
      // Quando abre para novo, garante a frente atual
      form.setValue("frontId", selectedFrontId !== "all" ? selectedFrontId : "")
    }
  }

  const onSubmit: SubmitHandler<ExpenseFormValues> = (values) => {
    const targetSeasonId = editingExpense ? editingExpense.seasonId : selectedSeasonId
    if (targetSeasonId === "all") return

    const payload: PlantingExpenseFormData = {
      seasonId: targetSeasonId,
      frontId: values.frontId,
      vehicleId: values.vehicleId === "none" || values.vehicleId === "" ? undefined : values.vehicleId,
      category: values.category,
      date: new Date(values.date).toISOString(),
      description: values.itemDescription,
      itemDescription: values.itemDescription,
      invoiceNumber: values.invoiceNumber || undefined,
      quantity: values.quantity,
      unitValueInCents: values.unitValue,
      supplierId: values.supplierId === "none" || values.supplierId === "" ? undefined : values.supplierId,
    }

    if (editingExpense) {
      updateExpenseMutation.mutate({ id: editingExpense.id, data: payload }, {
        onSuccess: () => {
          handleModalClose(false)
        }
      })
    } else {
      createExpenseMutation.mutate(payload, {
        onSuccess: () => {
          handleModalClose(false)
        }
      })
    }
  }

  const formValues = form.watch()
  const formTotal = ((Number(formValues.quantity || 0) * Number(formValues.unitValue || 0)) / 100).toFixed(2)

  const expenses = response?.data || []
  const meta = response?.meta

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gastos Operacionais</h2>
          <p className="text-muted-foreground">
            Lançamento de despesas vinculadas ao plantio.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedSeasonId} onValueChange={(v) => updateFilters({ seasonId: v, frontId: "all" })}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Safra" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Safras</SelectItem>
              {seasons?.map((season) => (
                <SelectItem key={season.id} value={season.id}>
                  {season.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={isModalOpen} onOpenChange={handleModalClose}>
            <DialogTrigger asChild>
              <Button disabled={selectedSeasonId === "all"}>
                <Plus className="size-4" /> Novo Gasto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingExpense ? "Editar Despesa" : "Lançar Despesa"}</DialogTitle>
                <DialogDescription>
                  Este lançamento gerará uma saída no módulo Financeiro automaticamente.
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data e Hora</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecione a categoria" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.values(ExpenseCategory).map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                  {categoryLabels[cat]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="frontId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frente</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecione a frente" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {fronts?.map((front) => (
                                <SelectItem key={front.id} value={front.id}>{front.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="invoiceNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>NF/Recibo (Opcional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: 12345" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="itemDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Item/Serviço</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Óleo Diesel S10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="supplierId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fornecedor (Opcional)</FormLabel>
                        <FormControl>
                          <SupplierSelect 
                            value={field.value} 
                            onChange={(val) => field.onChange(val || "")} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vehicleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Veículo (Opcional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "none"}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecione o veículo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Nenhum veículo</SelectItem>
                            {vehicles.map((v) => (
                              <SelectItem key={v.id} value={v.id}>
                                <div className="flex items-center gap-2">
                                  {v.color && <div className="size-2 rounded-full border border-muted" style={{ backgroundColor: v.color }} />}
                                  <span>{v.model} ({v.plate})</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantidade</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="unitValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Unitário</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="R$ 0,00"
                              value={formatCentsToReal(field.value)}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, "")
                                field.onChange(Number(value))
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex flex-col space-y-2">
                      <Label>Total</Label>
                      <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted/50 px-3 py-1 text-sm font-medium shadow-sm">
                        R$ {formTotal}
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="pt-4">
                    <Button type="submit" disabled={createExpenseMutation.isPending || updateExpenseMutation.isPending}>
                      {editingExpense ? "Salvar Alterações" : "Confirmar Lançamento"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="relative overflow-visible">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label>Frente</Label>
              <Select value={selectedFrontId} onValueChange={(v) => updateFilters({ frontId: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas as frentes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as frentes</SelectItem>
                  {fronts?.map((front) => (
                    <SelectItem key={front.id} value={front.id}>{front.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={(v) => updateFilters({ category: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {Object.values(ExpenseCategory).map((cat) => (
                    <SelectItem key={cat} value={cat}>{categoryLabels[cat]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Veículo</Label>
              <Select value={vehicleId} onValueChange={(v) => updateFilters({ vehicleId: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos os veículos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os veículos</SelectItem>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.plate} - {v.model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Filtro de Data</Label>
              <Select value={dateType} onValueChange={(v) => updateFilters({ dateType: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filtrar por..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as datas</SelectItem>
                  <SelectItem value="month">Por Mês</SelectItem>
                  <SelectItem value="fortnight">Por Quinzena</SelectItem>
                  <SelectItem value="range">Intervalo</SelectItem>
                  <SelectItem value="specific">Data Específica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dateType === "month" || dateType === "fortnight" ? (
              <div className="space-y-2">
                <Label>Mês</Label>
                <Input 
                  type="month" 
                  value={month} 
                  onChange={(e) => updateFilters({ month: e.target.value })} 
                />
              </div>
            ) : dateType === "range" || dateType === "specific" ? (
              <div className="space-y-2">
                <Label>{dateType === "specific" ? "Data" : "Data Inicial"}</Label>
                <Input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => updateFilters({ startDate: e.target.value })} 
                />
              </div>
            ) : null}

            {dateType === "fortnight" && (
              <div className="space-y-2">
                <Label>Quinzena</Label>
                <Select value={fortnight} onValueChange={(v) => updateFilters({ fortnight: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1ª Quinzena (01-15)</SelectItem>
                    <SelectItem value="2">2ª Quinzena (16-31)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {dateType === "range" && (
              <div className="space-y-2">
                <Label>Data Final</Label>
                <Input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => updateFilters({ endDate: e.target.value })} 
                />
              </div>
            )}
          </div>
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

      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border-x">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Data</TableHead>
                  <TableHead className="w-[120px]">Categoria</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Frente</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead className="text-right">Quant.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-[80px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={9}><Skeleton className="h-8 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                      Nenhum gasto operacional encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map((expense) => (
                    <TableRow key={expense.id} className={expense.isClosed ? "bg-muted/30" : ""}>
                      <TableCell>
                        <div className="flex flex-col text-xs">
                          <span>{new Date(expense.date).toLocaleDateString("pt-BR")}</span>
                          <span className="text-muted-foreground font-light text-[10px]">
                            {new Date(expense.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-normal uppercase">
                          {categoryLabels[expense.category as ExpenseCategory] || expense.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate font-medium text-sm">
                        {expense.description}
                      </TableCell>
                      <TableCell className="text-xs">{expense.supplier?.name || "-"}</TableCell>
                      <TableCell className="text-xs">{expense.front?.name || "-"}</TableCell>
                      <TableCell>
                        {expense.vehicle ? (
                          <div className="flex items-center gap-1.5 text-xs">
                            {expense.vehicle.color && (
                              <div className="size-2 rounded-full border border-muted" style={{ backgroundColor: expense.vehicle.color }} />
                            )}
                            <span className="font-mono">{expense.vehicle.plate}</span>
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-right text-xs">{expense.quantity}</TableCell>
                      <TableCell className="text-right text-sm font-bold text-primary">
                        {formatCurrency(expense.totalValueInCents)}
                      </TableCell>
                      <TableCell className="text-right">
                        {!expense.isClosed && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="size-4" />
                                <span className="sr-only">Ações</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditClick(expense)}>
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => setExpenseToDelete(expense.id)}
                              >
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {meta && meta.total > 0 && (
            <div className="border-t">
              <Pagination
                meta={meta}
                onPageChange={(p) => updateFilters({ page: p })}
                onLimitChange={(l) => updateFilters({ limit: l, page: 1 })}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!expenseToDelete} onOpenChange={(open) => !open && setExpenseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Gasto Operacional?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá permanentemente o gasto e o lançamento financeiro associado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => expenseToDelete && deleteExpenseMutation.mutate(expenseToDelete, { onSuccess: () => setExpenseToDelete(null) })}
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

export default function PlantingExpensesPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-32 w-full" />
        <Card>
          <CardContent className="p-0">
            <div className="p-8 flex items-center justify-center">
              <Loader2 className="size-8 animate-spin text-muted-foreground mr-2" />
              <span className="text-muted-foreground">Carregando dados...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <ExpensesContent />
    </Suspense>
  )
}
