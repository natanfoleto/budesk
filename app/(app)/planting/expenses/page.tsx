"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import { Plus, Trash } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"

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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
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
  useCreateExpense,
  useDeleteExpense,
  usePlantingExpenses,
  usePlantingSeasons,
  useWorkFronts,
} from "@/hooks/use-planting"
import { formatCurrency } from "@/lib/utils"
import { PlantingExpenseFormData } from "@/types/planting"

type Vehicle = { id: string; plate: string; model: string }

const expenseSchema = z.object({
  date: z.string().min(1, "A data é obrigatória"),
  frontId: z.string().min(1, "Selecione uma frente de trabalho"),
  vehicleId: z.string().optional().or(z.literal("")),
  itemDescription: z.string().min(1, "Informe a descrição do item/serviço"),
  invoiceNumber: z.string().optional(),
  quantity: z.preprocess((val) => Number(val), z.number().min(0.01, "A quantidade deve ser maior que 0")),
  unitValue: z.preprocess((val) => Number(val), z.number().min(0, "O valor unitário não pode ser negativo")),
})

type ExpenseFormValues = z.infer<typeof expenseSchema>

export default function PlantingExpensesPage() {
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("all")
  const [isModalOpen, setIsModalOpen] = useState(false)

  const form = useForm<ExpenseFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(expenseSchema) as any,
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      frontId: "",
      vehicleId: "",
      itemDescription: "",
      invoiceNumber: "",
      quantity: 1,
      unitValue: 0,
    },
  })

  // Queries
  const { data: seasons } = usePlantingSeasons()
  const { data: fronts } = useWorkFronts(selectedSeasonId !== "all" ? selectedSeasonId : undefined)
  const { data: expenses, isLoading } = usePlantingExpenses(
    selectedSeasonId !== "all" ? { seasonId: selectedSeasonId } : undefined
  )

  // Vehicles fetch using useQuery
  const { data: vehicles } = useQuery<Vehicle[]>({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const res = await fetch("/api/vehicles")
      if (!res.ok) throw new Error("Falha ao buscar veículos")
      return res.json()
    },
    enabled: isModalOpen,
  })

  // Mutations
  const createExpenseMutation = useCreateExpense()
  const deleteExpenseMutation = useDeleteExpense()

  const onSubmit = (values: ExpenseFormValues) => {
    if (selectedSeasonId === "all") return

    const payload: PlantingExpenseFormData = {
      seasonId: selectedSeasonId,
      frontId: values.frontId,
      vehicleId: values.vehicleId || undefined,
      date: new Date(values.date).toISOString(),
      description: values.itemDescription,
      itemDescription: values.itemDescription,
      invoiceNumber: values.invoiceNumber || undefined,
      quantity: values.quantity,
      unitValueInCents: Math.round(values.unitValue * 100),
    }

    createExpenseMutation.mutate(payload, {
      onSuccess: () => {
        setIsModalOpen(false)
        form.reset({
          date: new Date().toISOString().split("T")[0],
          frontId: "",
          vehicleId: "",
          itemDescription: "",
          invoiceNumber: "",
          quantity: 1,
          unitValue: 0,
        })
      }
    })
  }

  const formValues = form.watch()
  const formTotal = (Number(formValues.quantity || 0) * Number(formValues.unitValue || 0)).toFixed(2)

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
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filtrar por Safra" />
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

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button disabled={selectedSeasonId === "all"}>
                <Plus className="h-4 w-4" /> Novo Gasto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Lançar Despesa Operacional</DialogTitle>
                <DialogDescription>
                  Este lançamento gerará uma saída no módulo Financeiro automaticamente.
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                        <FormLabel className="text-right">Data</FormLabel>
                        <div className="col-span-3 space-y-1">
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="frontId"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                        <FormLabel className="text-right">Frente</FormLabel>
                        <div className="col-span-3 space-y-1">
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
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="itemDescription"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                        <FormLabel className="text-right">Item/Serviço</FormLabel>
                        <div className="col-span-3 space-y-1">
                          <FormControl>
                            <Input placeholder="Ex: Óleo Diesel S10" {...field} />
                          </FormControl>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="invoiceNumber"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                        <FormLabel className="text-right">NF/Recibo</FormLabel>
                        <div className="col-span-3 space-y-1">
                          <FormControl>
                            <Input placeholder="Opcional" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vehicleId"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                        <FormLabel className="text-right">Veículo</FormLabel>
                        <div className="col-span-3 space-y-1">
                          <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Opcional (se for frota)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Nenhum veículo</SelectItem>
                              {vehicles?.map((v) => (
                                <SelectItem key={v.id} value={v.id}>{v.model} ({v.plate})</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-[1fr_1fr_1fr] gap-4">
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel>Quant.</FormLabel>
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
                        <FormItem className="space-y-1">
                          <FormLabel>Valor Unit. (R$)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-1">
                      <FormLabel>Total</FormLabel>
                      <Input value={`R$ ${formTotal}`} disabled className="bg-muted font-bold h-10" />
                    </div>
                  </div>

                  <DialogFooter className="pt-4">
                    <Button type="submit" disabled={createExpenseMutation.isPending}>
                      Confirmar Lançamento
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
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
                    <TableCell className="font-medium">{expense.description}</TableCell>
                    <TableCell>{"-"}</TableCell>
                    <TableCell>{expense.front?.name || "-"}</TableCell>
                    <TableCell>{expense.vehicle?.plate || "-"}</TableCell>
                    <TableCell className="text-right">{expense.quantity ?? 1}</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(expense.totalValueInCents)}</TableCell>
                    <TableCell>
                      {!expense.isClosed && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Tem certeza que deseja remover este gasto? A transação financeira também será removida.")) {
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
