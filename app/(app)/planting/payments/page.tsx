"use client"

import { useQuery } from "@tanstack/react-query"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CircleSlash, FilterX, Loader2, Scissors, Search, Sprout } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useEmployeeTags } from "@/hooks/use-employee-tags"
import { usePlantingSeasons } from "@/hooks/use-planting"
import { apiRequest } from "@/lib/api-client"
import { formatCurrency } from "@/lib/utils"
import { EmployeeDetailsModal } from "@/src/modules/planting/components/EmployeeDetailsModal"
import { PaymentAssistantModal } from "@/src/modules/planting/components/PaymentAssistantModal"
import { EmployeeSummary } from "@/src/modules/planting/services/PlantingEmployeeService"

export default function PlantingPaymentsPage() {
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [nameFilter, setNameFilter] = useState<string>("")
  const [tagFilter, setTagFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const hasActiveFilters = 
    selectedSeasonId !== "all" || 
    categoryFilter !== "all" || 
    nameFilter !== "" || 
    tagFilter !== "all" || 
    statusFilter !== "all"

  const clearFilters = () => {
    setSelectedSeasonId("all")
    setCategoryFilter("all")
    setNameFilter("")
    setTagFilter("all")
    setStatusFilter("all")
    setPage(1)
  }

  // Pagination state
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  useEffect(() => {
    setPage(1)
  }, [selectedSeasonId, categoryFilter, nameFilter, tagFilter, statusFilter, limit])

  // Modals state
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const { data: seasons } = usePlantingSeasons()
  const { data: tags } = useEmployeeTags()

  const { data: summaries, isLoading, refetch } = useQuery<EmployeeSummary[]>({
    queryKey: ["payments-summary", selectedSeasonId],
    queryFn: () => {
      const params = new URLSearchParams()
      if (selectedSeasonId && selectedSeasonId !== "all") params.set("seasonId", selectedSeasonId)
      return apiRequest<EmployeeSummary[]>(`/api/planting/payments/summary?${params.toString()}`)
    },
    enabled: selectedSeasonId !== "all"
  })

  const filteredSummaries = summaries?.filter(s => {
    // 1. Name Filter
    if (nameFilter && !s.employee.name.toLowerCase().includes(nameFilter.toLowerCase())) return false
    
    // 2. Category Filter
    if (categoryFilter !== "all") {
      if (categoryFilter === "NONE" && s.employee.plantingCategory) return false
      if (categoryFilter !== "NONE" && s.employee.plantingCategory !== categoryFilter) return false
    }
    
    // 3. Tag Filter
    if (tagFilter !== "all" && tagFilter !== "Sem Etiqueta") {
      const hasTag = s.employee.tags?.some((t: { tagId: string }) => t.tagId === tagFilter)
      if (!hasTag) return false
    } else if (tagFilter === "Sem Etiqueta") {
      if (s.employee.tags && s.employee.tags.length > 0) return false
    }

    // 4. Status Filter
    const totalPayments = s.details.payments?.reduce((acc: number, p: { holeriteNetInCents: number }) => acc + p.holeriteNetInCents, 0) || 0
    
    // Simple heuristic: If multiple payments reached the net amount (or at least there is one payment) we consider it Paid/Fechado.
    // Given the user wants Em Aberto / Fechado, let's treat it as Fechado if totalPayments >= netValueToPay and netValueToPay > 0.
    // Wait, simpler: if they have any payment registered in this period for the Net amount, it's 'closed'.
    // Let's use `totalPayments > 0` as it indicates that holerite was paid in the period.
    const isClosed = totalPayments > 0
    
    if (statusFilter === "closed" && !isClosed) return false
    if (statusFilter === "open" && isClosed) return false
    
    return true
  })

  // To list only the active/working employees or those with values:
  // Usually we show all that passed the filter, but maybe hide those with 0 earned?
  // Let's keep them if they have a salary or something, but usually sum earned > 0
  const displayItems = filteredSummaries?.filter(s => 
    s.totals.earnedInCents > 0 || (s.compensation && s.compensation.netCompensationInCents > 0) || !!s.details.payments?.length
  ).sort((a, b) => a.employee.name.localeCompare(b.employee.name)) || []

  const totalItems = displayItems.length
  const totalPages = Math.ceil(totalItems / limit) || 1
  const paginatedItems = displayItems.slice((page - 1) * limit, page * limit)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pagamentos e Holerites</h2>
          <p className="text-muted-foreground">
            Gestão consolidada de fechamentos, diárias, produções e adiantamentos.
          </p>
        </div>
      </div>

      <Card className="relative overflow-visible">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Safra</Label>
              <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a Safra" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Safras</SelectItem>
                  {seasons?.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Status de Pagamento</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="open">Em Aberto (Pendente)</SelectItem>
                  <SelectItem value="closed">Fechado (Pago)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-10 mt-4 items-end">
            <div className="space-y-2 lg:col-span-4">
              <Label>Buscar Funcionário</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input 
                  placeholder="Nome do funcionário" 
                  className="pl-8" 
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2 lg:col-span-3">
              <Label>Categoria Plantio</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  <SelectItem value="PLANTIO">Plantio</SelectItem>
                  <SelectItem value="CORTE">Corte</SelectItem>
                  <SelectItem value="NONE">Sem Tipo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 lg:col-span-3">
              <Label>Filtrar por Etiquetas</Label>
              <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas as etiquetas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as etiquetas</SelectItem>
                  {tags?.map((t: { id: string; name: string; color: string }) => (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full" style={{ backgroundColor: t.color }} />
                        {t.name}
                      </div>
                    </SelectItem>
                  ))}
                  <SelectItem value="Sem Etiqueta">Sem Etiqueta</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
          <div className="rounded-md border-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="pl-6 font-semibold">Funcionário</TableHead>
                  <TableHead className="text-right font-semibold">Ganhos</TableHead>
                  <TableHead className="text-right font-semibold">Rend. Fixo</TableHead>
                  <TableHead className="text-right font-semibold">Adiantamentos</TableHead>
                  <TableHead className="text-right font-semibold">Valor Líquido</TableHead>
                  <TableHead className="text-center font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedSeasonId === "all" ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                      Selecione uma Safra e o período para visualizar os pagamentos.
                    </TableCell>
                  </TableRow>
                ) : isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Calculando resumos financeiros...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : displayItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                      Nenhum funcionário encontrado com valores no período e filtros atuais.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedItems.map((s: EmployeeSummary) => {
                    const earned = s.totals.earnedInCents || 0
                    const fixed = s.compensation?.netCompensationInCents || 0
                    const advances = s.totals.advancesInCents || 0
                    const netValue = earned + fixed - advances
                    const isClosed = (s.details.payments?.length || 0) > 0

                    return (
                      <TableRow 
                        key={s.employee.id} 
                        className="group hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedEmployeeId(s.employee.id)
                          setIsAssistantOpen(true)
                        }}
                      >
                        <TableCell className="pl-6 font-medium">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {s.employee.name}
                              </span>
                              {s.employee.plantingCategory === "PLANTIO" && <Sprout className="h-3 w-3 text-emerald-600" />}
                              {s.employee.plantingCategory === "CORTE" && <Scissors className="h-3 w-3 text-amber-600" />}
                              {(!s.employee.plantingCategory) && <CircleSlash className="h-3 w-3 text-slate-400" />}
                            </div>
                            {s.employee.tags && s.employee.tags.length > 0 && (
                              <div className="flex gap-1 flex-wrap">
                                {s.employee.tags.map((et: { tag: { id: string; name: string; color: string } }) => (
                                  <TooltipProvider key={et.tag.id}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div 
                                          className="w-2.5 h-2.5 rounded-full cursor-help"
                                          style={{ backgroundColor: et.tag.color }}
                                        />
                                      </TooltipTrigger>
                                      <TooltipContent className="text-xs">{et.tag.name}</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium text-emerald-700 whitespace-nowrap">
                          {formatCurrency(earned)}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium text-blue-700 whitespace-nowrap">
                          {formatCurrency(fixed)}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium text-destructive whitespace-nowrap">
                          {advances > 0 ? "-" + formatCurrency(advances) : "R$ 0,00"}
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold whitespace-nowrap">
                          {formatCurrency(netValue)}
                        </TableCell>
                        <TableCell className="text-center">
                          {isClosed ? (
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                              Fechado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                              Em Aberto
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {totalItems > 0 && (
            <div className="flex items-center justify-between p-4 border-t">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">Linhas por página</p>
                  <Select
                    value={String(limit)}
                    onValueChange={(v) => setLimit(Number(v))}
                  >
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue placeholder={limit} />
                    </SelectTrigger>
                    <SelectContent side="top">
                      {[10, 20, 30, 40, 50].map((pageSize) => (
                        <SelectItem key={pageSize} value={String(pageSize)}>
                          {pageSize}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-muted-foreground">
                  Total de registros: {totalItems}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-sm text-muted-foreground pr-2">
                  Página {page} de {totalPages}
                </div>
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => setPage(1)}
                  disabled={page <= 1}
                >
                  <span className="sr-only">Primeira página</span>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                >
                  <span className="sr-only">Página anterior</span>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                >
                  <span className="sr-only">Próxima página</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => setPage(totalPages)}
                  disabled={page >= totalPages}
                >
                  <span className="sr-only">Última página</span>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <EmployeeDetailsModal
        employeeId={selectedEmployeeId}
        seasonId={selectedSeasonId}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        onNavigate={(target) => {
          if (target === "assistant") {
            setIsDetailsOpen(false)
            setIsAssistantOpen(true)
          }
        }}
      />
      <PaymentAssistantModal
        employeeId={selectedEmployeeId}
        seasonId={selectedSeasonId}
        open={isAssistantOpen}
        onOpenChange={setIsAssistantOpen}
        onNavigate={(target) => {
          if (target === "details") {
            setIsAssistantOpen(false)
            setIsDetailsOpen(true)
          }
        }}
        onUpdate={() => refetch()}
      />
    </div>
  )
}
