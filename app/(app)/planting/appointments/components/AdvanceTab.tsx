"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { Loader2, MoreHorizontal, Plus, Search } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  FormDescription,
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
import { useEmployees } from "@/hooks/use-employees"
import { apiRequest } from "@/lib/api-client"
import { cn, formatCentsToReal } from "@/lib/utils"
import { isBeforeAdmission, isEmployeeActiveAtDate } from "@/lib/utils/planting-utils"
import { EmployeeDetailsModal } from "@/src/modules/planting/components/EmployeeDetailsModal"
import { PlantingAdvance, PlantingAdvanceFormData } from "@/types/planting"

interface AdvanceTabProps {
  seasonId: string
  frontId: string
  date: string
  employeeNameFilter: string
  onEmployeeFilterChange?: (name: string) => void
  selectedTagIds?: string[]
  isPeriodClosed: boolean
}

type AdvanceFormValues = PlantingAdvanceFormData

export function AdvanceTab({
  seasonId,
  frontId,
  date,
  employeeNameFilter,
  onEmployeeFilterChange,
  selectedTagIds = [],
  isPeriodClosed,
}: AdvanceTabProps) {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAdvance, setEditingAdvance] = useState<PlantingAdvance | null>(null)
  const [advanceToDelete, setAdvanceToDelete] = useState<string | null>(null)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false)

  const { data: employees } = useEmployees({ tagIds: selectedTagIds })
  
  const { data: advances, isLoading } = useQuery<PlantingAdvance[]>({
    queryKey: ["planting-advances", seasonId, frontId, date, selectedTagIds],
    queryFn: () => {
      const params = new URLSearchParams()
      if (seasonId !== "all") params.set("seasonId", seasonId)
      if (frontId !== "all") params.set("frontId", frontId)
      if (date) params.set("date", date)
      if (selectedTagIds.length > 0) {
        selectedTagIds.forEach(id => params.append("tagIds", id))
      }
      
      return apiRequest<PlantingAdvance[]>(`/api/planting/advances?${params.toString()}`)
    },
    enabled: seasonId !== "all",
  })

  const form = useForm<AdvanceFormValues>({
    defaultValues: {
      employeeId: "",
      date: date || format(new Date(), "yyyy-MM-dd"),
      valueInCents: 0,
      notes: "",
      discountInCurrentFortnight: true,
      seasonId: seasonId !== "all" ? seasonId : "",
      frontId: frontId !== "all" ? frontId : "",
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: PlantingAdvanceFormData) => 
      apiRequest("/api/planting/advances", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planting-advances"] })
      toast.success("Adiantamento criado com sucesso")
      setIsModalOpen(false)
      form.reset()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: PlantingAdvanceFormData) => 
      apiRequest(`/api/planting/advances/${data.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planting-advances"] })
      toast.success("Adiantamento atualizado com sucesso")
      setIsModalOpen(false)
      setEditingAdvance(null)
      form.reset()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest(`/api/planting/advances/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planting-advances"] })
      toast.success("Adiantamento excluído com sucesso")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const onSubmit = (data: AdvanceFormValues) => {
    const payload = {
      ...data,
      seasonId: seasonId !== "all" ? seasonId : data.seasonId,
      frontId: frontId !== "all" ? frontId : data.frontId,
    }

    if (editingAdvance) {
      updateMutation.mutate({ ...payload, id: editingAdvance.id })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleEdit = (advance: PlantingAdvance) => {
    setEditingAdvance(advance)
    form.reset({
      employeeId: advance.employeeId,
      date: format(new Date(advance.date.split("T")[0] + "T12:00:00"), "yyyy-MM-dd"),
      valueInCents: advance.valueInCents,
      notes: advance.notes || "",
      discountInCurrentFortnight: advance.discountInCurrentFortnight,
      seasonId: advance.seasonId,
      frontId: advance.frontId,
    })
    setIsModalOpen(true)
  }

  const filteredAdvances = advances?.filter(a => 
    a.employee?.name.toLowerCase().includes(employeeNameFilter.toLowerCase())
  )

  if (seasonId === "all") {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-lg">
        <h3 className="text-lg font-medium">Selecione uma Safra</h3>
        <p className="text-muted-foreground mt-1">Para gerenciar adiantamentos, selecione uma safra específica nos filtros acima.</p>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg">Gestão de Adiantamentos</CardTitle>
          <CardDescription>
            Gerencie os adiantamentos financeiros solicitados pelos funcionários.
          </CardDescription>
        </div>
        <Button 
          onClick={() => {
            setEditingAdvance(null)
            form.reset({
              employeeId: "",
              date: date,
              valueInCents: 0,
              notes: "",
              discountInCurrentFortnight: true,
              seasonId: seasonId,
              frontId: frontId !== "all" ? frontId : "",
            })
            setIsModalOpen(true)
          }}
          disabled={isPeriodClosed}
        >
          <Plus className="size-4" /> Novo Adiantamento
        </Button>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Funcionário</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Descontar agora?</TableHead>
                <TableHead>Observação</TableHead>
                <TableHead className="text-right w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                    Carregando adiantamentos...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredAdvances?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum adiantamento encontrado para esta data/filtros.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAdvances?.map((adv) => (
                  <TableRow 
                    key={adv.id}
                    className={cn(
                      editingAdvance?.id === adv.id && "bg-slate-200/60",
                      "hover:bg-muted/50 transition-colors"
                    )}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2 group">
                        <span
                          className="cursor-pointer hover:underline underline-offset-4 decoration-primary/50 transition-all"
                          onClick={() => {
                            setSelectedEmployeeId(adv.employeeId)
                            setIsEmployeeModalOpen(true)
                          }}
                        >
                          {adv.employee?.name}
                        </span>
                        {(() => {
                          const empObj = employees?.data.find(e => e.id === adv.employeeId)
                          if (!empObj) return null
                          
                          const isTerminated = !isEmployeeActiveAtDate(date, empObj.terminationDate)
                          const isPreAdmission = isBeforeAdmission(date, empObj.admissionDate)
                          
                          return (
                            <div className="flex gap-1">
                              {isTerminated && empObj.terminationDate && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="bg-muted text-muted-foreground text-[9px] font-black px-1 py-0.5 rounded border border-border shadow-sm whitespace-nowrap cursor-help uppercase">
                                        ENCERRADO
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Contrato encerrado em {new Date(new Date(empObj.terminationDate).toISOString().split('T')[0] + "T12:00:00").toLocaleDateString("pt-BR")}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              {isPreAdmission && empObj.admissionDate && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="bg-pink-100 text-pink-700 text-[9px] font-black px-1 py-0.5 rounded border border-pink-200 shadow-sm whitespace-nowrap cursor-help uppercase">
                                        PRÉ-ADMISSÃO
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Admissão em {new Date(new Date(empObj.admissionDate).toISOString().split('T')[0] + "T12:00:00").toLocaleDateString("pt-BR")}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          )
                        })()}
                        <button
                          onClick={() => {
                            if (onEmployeeFilterChange) {
                              const name = adv.employee?.name || ""
                              onEmployeeFilterChange(employeeNameFilter === name ? "" : name)
                            }
                          }}
                          className={`p-1 rounded-md transition-colors cursor-pointer ${
                            employeeNameFilter === adv.employee?.name 
                              ? "bg-primary text-primary-foreground" 
                              : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted"
                          }`}
                          title={employeeNameFilter === adv.employee?.name ? "Limpar filtro" : "Filtrar por este funcionário"}
                        >
                          <Search className="size-3" />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>{format(new Date(adv.date.split("T")[0] + "T12:00:00"), "dd/MM/yyyy")}</TableCell>
                    <TableCell>
                      {formatCentsToReal(adv.valueInCents)}
                    </TableCell>
                    <TableCell>
                      {adv.discountInCurrentFortnight ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            Sim
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                            Posterior
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={adv.notes || ""}>
                      {adv.notes || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            className="h-8 w-8 p-0"
                            disabled={isPeriodClosed}
                          >
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="cursor-pointer"
                            onClick={() => handleEdit(adv)}
                          >
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive cursor-pointer"
                            onClick={() => setAdvanceToDelete(adv.id)}
                          >
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingAdvance ? "Editar Adiantamento" : "Novo Adiantamento"}</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="employeeId"
                rules={{ required: "Selecione um funcionário" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Funcionário</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!!editingAdvance}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o funcionário" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees?.data.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  rules={{ required: "Selecione a data" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="valueInCents"
                  rules={{ required: "Informe o valor", min: { value: 1, message: "Valor deve ser maior que zero" } }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor</FormLabel>
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
              </div>

              <FormField
                control={form.control}
                name="discountInCurrentFortnight"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Descontar na quinzena atual
                      </FormLabel>
                      <FormDescription>
                        Se marcado, este valor será subtraído no próximo fechamento.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observação (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Motivo do adiantamento..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  {editingAdvance ? "Salvar Alterações" : "Criar Adiantamento"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!advanceToDelete} onOpenChange={(open) => !open && setAdvanceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O adiantamento será excluído permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (advanceToDelete) {
                  deleteMutation.mutate(advanceToDelete, {
                    onSuccess: () => setAdvanceToDelete(null)
                  })
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <EmployeeDetailsModal
        employeeId={selectedEmployeeId}
        seasonId={seasonId}
        open={isEmployeeModalOpen}
        onOpenChange={setIsEmployeeModalOpen}
      />
    </Card>
  )
}
