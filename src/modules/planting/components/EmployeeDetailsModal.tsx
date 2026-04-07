"use client"

import { AttendanceType,PlantingPayment } from "@prisma/client"
import { 
  endOfMonth,
  format,
  startOfMonth} from "date-fns"
import { ptBR } from "date-fns/locale"
import { 
  AlertCircle,
  Calendar, 
  ChartNoAxesCombined, 
  CheckCircle2, 
  Clock,
  Copy,
  DollarSign,
  Info,
  Landmark,
  MoreHorizontal,
  QrCode,
  TrendingUp, 
  XCircle} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { 
  Bar,
  BarChart,
  CartesianGrid, 
  Legend,
  Line, 
  LineChart, 
  ResponsiveContainer,
  Tooltip as RechartsTooltip, 
  XAxis, 
  YAxis
} from "recharts"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip"
import { useCreateDailyWageBulk } from "@/hooks/use-planting"
import { apiRequest } from "@/lib/api-client"
import { cn, formatAccountIdentifier, formatCentsToReal, parseLocalDate } from "@/lib/utils"
import { DailyWageFormData } from "@/types/planting"

import { EmployeeSummary } from "../services/PlantingEmployeeService"
import { ReportSelectionModal } from "./ReportSelectionModal"

interface EmployeeDetailsModalProps {
  employeeId: string | null
  seasonId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

type FilterType = "GERAL" | "HOJE" | "P_QUINZENAL" | "S_QUINZENAL" | "MES_ATUAL" | "CUSTOM" | string

export function EmployeeDetailsModal({ 
  employeeId, 
  seasonId, 
  open, 
  onOpenChange 
}: EmployeeDetailsModalProps) {
  const [data, setData] = useState<EmployeeSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("resumo")
  const [filterType, setFilterType] = useState<FilterType>("GERAL")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [availableMonths, setAvailableMonths] = useState<{ year: number; month: number }[]>([])
  const [applyCompensationRules, setApplyCompensationRules] = useState(true)

  // Payment form state
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null)
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [holeriteValue, setHoleriteValue] = useState<number>(0)
  const [paymentNotes, setPaymentNotes] = useState("")
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false)
  const bulkCreateDailyWageMutation = useCreateDailyWageBulk()
  const [pendingPresenceChanges, setPendingPresenceChanges] = useState<Record<string, AttendanceType>>({})
  const [isPaidNow, setIsPaidNow] = useState(false)

  const fetchMonths = useCallback(async () => {
    if (!employeeId || !seasonId) return
    try {
      const result = await apiRequest<{ year: number; month: number }[]>(`/api/planting/employees/${employeeId}/months?seasonId=${seasonId}`)
      setAvailableMonths(result)
    } catch (error) {
      console.error("Erro ao buscar meses:", error)
    }
  }, [employeeId, seasonId])

  const calculateDateRange = useCallback((type: FilterType) => {
    const now = new Date()
    // Set to midday to avoid timezone shifts at boundaries
    now.setHours(12, 0, 0, 0)
    
    switch (type) {
    case "HOJE":
      return { start: format(now, "yyyy-MM-dd"), end: format(now, "yyyy-MM-dd") }
    case "P_QUINZENAL": {
      const start = startOfMonth(now)
      const end = new Date(start)
      end.setDate(15)
      return { 
        start: format(start, "yyyy-MM-dd"), 
        end: format(end, "yyyy-MM-dd") 
      }
    }
    case "S_QUINZENAL": {
      const start = startOfMonth(now)
      start.setDate(16)
      const end = endOfMonth(now)
      return { 
        start: format(start, "yyyy-MM-dd"), 
        end: format(end, "yyyy-MM-dd") 
      }
    }
    case "MES_ATUAL":
      return { 
        start: format(startOfMonth(now), "yyyy-MM-dd"), 
        end: format(endOfMonth(now), "yyyy-MM-dd") 
      }
    default:
      if (type.startsWith("MONTH_")) {
        // Format: MONTH_YYYY-MM_TYPE
        const parts = type.split("_")
        const [y, m] = parts[1].split("-").map(Number)
        const subType = parts[2] // FULL, Q1, Q2

        const monthDate = new Date(Date.UTC(y, m - 1, 1, 12, 0, 0))
        if (subType === "FULL") {
          return {
            start: format(startOfMonth(monthDate), "yyyy-MM-dd"),
            end: format(endOfMonth(monthDate), "yyyy-MM-dd")
          }
        } else if (subType === "Q1") {
          const start = startOfMonth(monthDate)
          const end = new Date(start)
          end.setDate(15)
          return {
            start: format(start, "yyyy-MM-dd"),
            end: format(end, "yyyy-MM-dd")
          }
        } else if (subType === "Q2") {
          const start = startOfMonth(monthDate)
          start.setDate(16)
          const end = endOfMonth(monthDate)
          return {
            start: format(start, "yyyy-MM-dd"),
            end: format(end, "yyyy-MM-dd")
          }
        }
      }
      return { start: "", end: "" }
    }
  }, [])

  const fetchData = useCallback(async () => {
    if (!employeeId) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ seasonId })
      if (filterType !== "GERAL") {
        const range = filterType === "CUSTOM" ? { start: startDate, end: endDate } : calculateDateRange(filterType)
        if (range.start) params.append("startDate", range.start)
        if (range.end) params.append("endDate", range.end)
      }

      const result = await apiRequest<EmployeeSummary>(`/api/planting/employees/${employeeId}/summary?${params.toString()}`)
      setData(result)
    } catch (error) {
      console.error(error)
      // QueryProvider will handle 401
    } finally {
      setLoading(false)
    }
  }, [employeeId, seasonId, filterType, startDate, endDate, calculateDateRange])

  useEffect(() => {
    if (open && employeeId) {
      fetchData()
      fetchMonths()
    } else {
      setData(null)
      setAvailableMonths([])
    }
  }, [open, employeeId, fetchData, fetchMonths])

  useEffect(() => {
    if (filterType !== "CUSTOM" && filterType !== "GERAL") {
      const range = calculateDateRange(filterType)
      setStartDate(range.start)
      setEndDate(range.end)
    } else if (filterType === "GERAL") {
      setStartDate("")
      setEndDate("")
    }
  }, [filterType, calculateDateRange])

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copiado!`, {
      description: text,
    })
  }

  const handleEditPayment = (payment: PlantingPayment) => {
    setEditingPaymentId(payment.id)
    setPaymentDate(format(parseLocalDate(payment.date), "yyyy-MM-dd"))
    setHoleriteValue(payment.holeriteNetInCents)
    setPaymentNotes(payment.notes || "")
    setIsPaidNow(payment.isPaid)
  }

  const handleCancelEdit = () => {
    setEditingPaymentId(null)
    setPaymentDate(format(new Date(), "yyyy-MM-dd"))
    setHoleriteValue(0)
    setPaymentNotes("")
    setIsPaidNow(false)
  }

  const handleRegisterPayment = async () => {
    if (!employeeId || !seasonId || !data) return
    if (!holeriteValue || holeriteValue <= 0) {
      toast.error("Informe um valor válido para o holerite")
      return
    }

    setIsSubmittingPayment(true)
    try {
      const parts = paymentDate.split("-").map(Number)
      
      if (editingPaymentId) {
        await apiRequest(`/api/planting/employees/${employeeId}/payments?id=${editingPaymentId}`, {
          method: "PATCH",
          body: JSON.stringify({
            date: paymentDate,
            holeriteNetInCents: holeriteValue,
            isPaid: isPaidNow,
            notes: paymentNotes
          })
        })
        toast.success("Pagamento atualizado com sucesso!")
      } else {
        await apiRequest(`/api/planting/employees/${employeeId}/payments`, {
          method: "POST",
          body: JSON.stringify({
            date: paymentDate,
            seasonId,
            month: parts[1],
            year: parts[0],
            systemBrutoInCents: data.totals.earnedInCents + (applyCompensationRules ? (data.compensation?.paidLeavesValueInCents || 0) : 0),
            systemNetInCents: data.totals.earnedInCents + (applyCompensationRules ? (data.compensation?.netCompensationInCents || 0) : 0) - data.totals.advancesInCents,
            holeriteNetInCents: holeriteValue,
            isPaid: isPaidNow,
            notes: paymentNotes
          })
        })
        toast.success("Pagamento registrado com sucesso!")
      }

      setEditingPaymentId(null)
      setHoleriteValue(0)
      setPaymentNotes("")
      setIsPaidNow(false)
      fetchData()
    } catch (error) {
      console.error(error)
      toast.error("Erro ao registrar pagamento")
    } finally {
      setIsSubmittingPayment(false)
    }
  }

  const handleTogglePaymentPaid = async (paymentId: string, currentStatus: boolean) => {
    try {
      await apiRequest(`/api/planting/employees/${employeeId}/payments?id=${paymentId}`, {
        method: "PATCH",
        body: JSON.stringify({ isPaid: !currentStatus })
      })
      toast.success(currentStatus ? "Pagamento marcado como pendente" : "Pagamento marcado como pago")
      fetchData()
    } catch (error) {
      console.error(error)
      toast.error("Erro ao atualizar status do pagamento")
    }
  }

  const handleDeletePayment = async (id: string) => {
    try {
      await apiRequest(`/api/planting/employees/${employeeId}/payments?id=${id}`, {
        method: "DELETE"
      })
      toast.success("Pagamento removido")
      fetchData()
    } catch (error) {
      console.error(error)
      toast.error("Erro ao remover pagamento")
    }
  }

  const handleSavePresenceChanges = async () => {
    if (!data || !employeeId) return

    const toSave = Object.entries(pendingPresenceChanges).map(([dateStr, newPresence]) => {
      // Find a frontId for this date
      const existingWage = data.details.wages.find(w => format(parseLocalDate(w.date), "yyyy-MM-dd") === dateStr)
      const existingProd = data.details.productions.find(pr => format(parseLocalDate(pr.date), "yyyy-MM-dd") === dateStr)
      const existingDriver = data.details.drivers.find(d => format(parseLocalDate(d.date), "yyyy-MM-dd") === dateStr)
      const existingAdvance = data.details.advances.find(a => format(parseLocalDate(a.date), "yyyy-MM-dd") === dateStr)

      const frontId = existingWage?.frontId || existingProd?.frontId || existingDriver?.frontId || existingAdvance?.frontId || ""

      return {
        id: existingWage?.id,
        employeeId,
        frontId, // we need at least some front ID.
        seasonId,
        date: new Date(dateStr + "T12:00:00Z").toISOString(),
        presence: newPresence,
        valueInCents: existingWage?.valueInCents || 0
      }
    })

    if (toSave.some(item => !item.frontId)) {
      toast.error("Não foi possível identificar a Frente de Trabalho para um ou mais dias.")
      return
    }

    try {
      await bulkCreateDailyWageMutation.mutateAsync(toSave as DailyWageFormData[])
      setPendingPresenceChanges({})
    } catch (error) {
      console.error(error)
    } finally {
      fetchData()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] max-h-[95vh] sm:max-w-none flex flex-col p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-6 border-b shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                {loading && !data ? (
                  <Skeleton className="h-8 w-64" />
                ) : (
                  <div className="flex items-center gap-2">
                    {data?.employee.name}
                    <ChartNoAxesCombined 
                      className="size-4 text-muted-foreground hover:text-primary transition-colors cursor-pointer" 
                      onClick={() => setReportModalOpen(true)}
                    />
                  </div>
                )}
              </DialogTitle>
              <DialogDescription>
                Detalhamento de performance e pagamentos no Plantio Manual
              </DialogDescription>
            </div>
            <div className="flex items-end gap-3">
              <div className="flex items-center gap-1.5">
                {data && (
                  <Label className="text-[10px] uppercase font-semibold px-0.5">
                    Safra: {data.seasonName}
                  </Label>
                )}
                <Select value={filterType} onValueChange={(val: FilterType) => setFilterType(val)}>
                  <SelectTrigger className="h-9 w-[180px] bg-background">
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GERAL">Geral (Todo o histórico)</SelectItem>
                    <SelectItem value="HOJE">Hoje ({format(new Date(), "dd/MM")})</SelectItem>
                    <SelectItem value="CUSTOM">Personalizado</SelectItem>
                    
                    <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase border-t mt-1">
                      Mês Atual
                    </div>
                    <SelectItem value="MES_ATUAL">Todo o mês ({format(startOfMonth(new Date()), "MMMM", { locale: ptBR })})</SelectItem>
                    <SelectItem value="P_QUINZENAL">1ª quinzena (01-15)</SelectItem>
                    <SelectItem value="S_QUINZENAL">2ª quinzena (16-{format(endOfMonth(new Date()), "dd")})</SelectItem>

                    {availableMonths.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase border-t mt-1">
                          Meses Anteriores
                        </div>
                        {availableMonths
                          .filter(m => {
                            const now = new Date()
                            return !(m.year === now.getFullYear() && m.month === (now.getMonth() + 1))
                          })
                          .map(m => {
                            const monthDate = new Date(m.year, m.month - 1, 1)
                            const monthName = format(monthDate, "MMMM/yy", { locale: ptBR })
                            const lastDay = format(endOfMonth(monthDate), "dd")
                            return (
                              <div key={`${m.year}-${m.month}`} className="space-y-0.5">
                                <SelectItem value={`MONTH_${m.year}-${String(m.month).padStart(2, '0')}_FULL`}>
                                  {monthName} (Geral)
                                </SelectItem>
                                <SelectItem value={`MONTH_${m.year}-${String(m.month).padStart(2, '0')}_Q1`} className="pl-6 text-xs text-muted-foreground">
                                  {monthName} (01-15)
                                </SelectItem>
                                <SelectItem value={`MONTH_${m.year}-${String(m.month).padStart(2, '0')}_Q2`} className="pl-6 text-xs text-muted-foreground">
                                  {monthName} (16-{lastDay})
                                </SelectItem>
                              </div>
                            )
                          })
                        }
                      </>
                    )}
                  </SelectContent>
                </Select>

              </div>

              {filterType === "CUSTOM" && (
                <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-right-2 duration-300">
                  <Input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-9 w-[130px] bg-background text-xs"
                  />
                  <span className="text-muted-foreground text-[10px] font-medium uppercase">até</span>
                  <Input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-9 w-[130px] bg-background text-xs"
                  />
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="flex-1 flex flex-col min-h-0"
          >
            <div className="px-6 shrink-0 bg-muted/20">
              <TabsList className="h-10 w-full p-1 bg-muted/50 rounded-lg">
                <TabsTrigger value="resumo" className="flex-1 px-4 py-2 text-xs font-semibold rounded-md data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Resumo Geral</TabsTrigger>
                <TabsTrigger value="producao" className="flex-1 px-4 py-2 text-xs font-semibold rounded-md data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Plantio & Corte</TabsTrigger>
                <TabsTrigger value="assistente" className="flex-1 px-4 py-2 text-xs font-semibold rounded-md data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Assistente de Pagamento</TabsTrigger>
                <TabsTrigger value="pagamentos" className="flex-1 px-4 py-2 text-xs font-semibold rounded-md data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Extrato Financeiro</TabsTrigger>
                <TabsTrigger value="frequencia" className="flex-1 px-4 py-2 text-xs font-semibold rounded-md data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Presença</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="resumo" className="mt-0 flex-1 min-h-0 overflow-hidden">
              <ScrollArea className="h-full px-6">
                {loading && !data ? (
                  <div className="py-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <Skeleton className="lg:col-span-2 h-[350px]" />
                      <Skeleton className="h-[350px]" />
                    </div>
                  </div>
                ) : data ? (
                  <div className="py-6 space-y-6">
                    {/* Totais Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card className="border-primary/20 shadow-sm">
                        <CardHeader className="p-4 pb-2 bg-muted/30 rounded-t-xl">
                          <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1 tracking-wider leading-none">
                            <DollarSign className="size-3" /> TOTAL GANHO
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="text-2xl font-bold">{formatCurrency(data.totals.earnedInCents)}</div>
                        </CardContent>
                      </Card>
                      <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="p-4 pb-2 bg-muted/30 rounded-t-xl">
                          <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1 tracking-wider leading-none">
                            <CheckCircle2 className="size-3" /> DIAS TRABALHADOS
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="text-2xl font-bold">{data.totals.daysWorked} <span className="text-sm font-normal text-muted-foreground">dias</span></div>
                        </CardContent>
                      </Card>
                      <Card className="border-red-200 shadow-sm">
                        <CardHeader className="p-4 pb-2 bg-muted/30 rounded-t-xl">
                          <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1 tracking-wider leading-none">
                            <XCircle className="size-3 text-destructive" /> TOTAL FALTAS
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="text-2xl font-bold text-destructive">{data.totals.absences} <span className="text-sm font-normal text-muted-foreground">faltas</span></div>
                        </CardContent>
                      </Card>
                      <Card className="border-primary/20 shadow-sm">
                        <CardHeader className="p-4 pb-2 bg-muted/30 rounded-t-xl">
                          <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1 tracking-wider leading-none">
                            <TrendingUp className="size-3" /> MÉDIA DIÁRIA
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="text-2xl font-bold text-primary">{formatCurrency(data.averages.dailyGainInCents)}</div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Insights and Accounts */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Evolution Chart */}
                      <Card className="col-span-full shadow-md border-primary/10 overflow-hidden">
                        <CardHeader className="bg-muted/30 py-3">
                          <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <TrendingUp className="size-4 text-primary" /> Evolução de Ganhos Diários
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[250px]">
                          {data.insights.gainEvolution.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                              Sem dados de evolução no período selecionado.
                            </div>
                          ) : (
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={data.insights.gainEvolution}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis 
                                  dataKey="date" 
                                  fontSize={10}
                                  stroke="#888888"
                                  tickFormatter={(val) => format(parseLocalDate(val), "dd/MM", { locale: ptBR })}
                                />
                                <YAxis 
                                  fontSize={10}
                                  stroke="#888888"
                                  tickFormatter={(val) => `R$ ${val / 100}`}
                                />
                                <RechartsTooltip 
                                  contentStyle={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-card-foreground)", borderRadius: "var(--radius-md)" }}
                                  itemStyle={{ color: "var(--color-card-foreground)" }}
                                  formatter={(value: number | string | readonly (number | string)[] | undefined) => [
                                    formatCurrency(Number(Array.isArray(value) ? value[0] : value) || 0), 
                                    "Ganho"
                                  ]}
                                  labelFormatter={(label) => format(parseLocalDate(label), "dd 'de' MMM", { locale: ptBR })}
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="valueInCents" 
                                  stroke="var(--primary)" 
                                  strokeWidth={2} 
                                  dot={{ r: 4 }} 
                                  activeDot={{ r: 6 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          )}
                        </CardContent>
                      </Card>

                    </div>
                  </div>
                ) : null}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="producao" className="mt-0 flex-1 min-h-0 overflow-hidden">
              <ScrollArea className="h-full px-6">
                {loading && !data ? (
                  <div className="py-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Skeleton className="h-[300px] w-full" />
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
                      </div>
                    </div>
                  </div>
                ) : data ? (
                  <div className="py-6 space-y-6">
                    {/* Productivity Summary Cards (Top Row) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card className="border-muted shadow-sm">
                        <CardHeader className="bg-muted/30 py-3 px-4">
                          <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">MELHOR DIA</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          {data.insights.mostProductiveDay ? (
                            <div className="flex items-center justify-between">
                              <div className="text-2xl font-bold">{data.insights.mostProductiveDay.meters} <span className="text-sm font-normal text-muted-foreground">m</span></div>
                              <Badge variant="secondary" className="text-[10px]">{format(parseLocalDate(data.insights.mostProductiveDay.date), "dd 'de' MMM", { locale: ptBR })}</Badge>
                            </div>
                          ) : <span className="text-sm text-muted-foreground italic">Sem dados</span>}
                        </CardContent>
                      </Card>
                      <Card className="border-muted shadow-sm">
                        <CardHeader className="bg-muted/30 py-3 px-4">
                          <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">MÉDIA DIÁRIA DE PLANTIO</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 text-2xl font-bold">
                          {data.averages.dailyPlantingMeters.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">m/dia</span>
                        </CardContent>
                      </Card>
                      <Card className="border-muted shadow-sm">
                        <CardHeader className="bg-muted/30 py-3 px-4">
                          <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">TOTAL METROS PLANTADOS</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 text-2xl font-bold">
                          {data.totals.plantingMeters.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">m</span>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Productivity Chart (Bottom Row - Full Width) */}
                    <Card className="border-muted shadow-sm overflow-hidden">
                      <CardHeader className="bg-muted/30 py-3 px-4">
                        <CardTitle className="text-sm font-bold">Produção por Dia (Metros)</CardTitle>
                      </CardHeader>
                      <CardContent className="h-[300px] p-4">
                        {data.insights.productivityEvolution.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-sm text-muted-foreground italic">
                            Sem dados de produção no período selecionado.
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.insights.productivityEvolution}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                              <XAxis 
                                dataKey="date" 
                                fontSize={10}
                                stroke="#888888"
                                tickFormatter={(val) => format(parseLocalDate(val), "dd/MM", { locale: ptBR })}
                              />
                              <YAxis 
                                fontSize={10}
                                stroke="#888888"
                              />
                              <RechartsTooltip 
                                contentStyle={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-card-foreground)", borderRadius: "var(--radius-md)" }}
                                itemStyle={{ color: "var(--color-card-foreground)" }}
                                labelFormatter={(label) => format(parseLocalDate(label), "dd 'de' MMM", { locale: ptBR })}
                              />
                              <Legend wrapperStyle={{ fontSize: 10, paddingTop: "10px" }} />
                              <Bar dataKey="planting" name="Plantio" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="cutting" name="Corte" fill="#f97316" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </CardContent>
                    </Card>

                  </div>
                ) : null}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="assistente" className="mt-0 flex-1 min-h-0 overflow-hidden">
              <ScrollArea className="h-full px-6">
                {loading && !data ? (
                  <div className="py-6 space-y-6">
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                      {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
                    </div>
                    <Skeleton className="h-[400px] w-full" />
                  </div>
                ) : data ? (
                  <div className="py-6 space-y-8 pb-12">
                    {/* Seção de Totais do Sistema */}
                    <div className="flex items-center justify-end mb-4">
                      <div className="flex items-center gap-2 bg-muted/40 p-2 px-3 rounded-lg border border-primary/20 shadow-sm">
                        <Label htmlFor="apply-compensation" className="text-[10px] font-bold text-muted-foreground uppercase cursor-pointer select-none">
                          Aplicar compensação (Faltas/Chuvas)
                        </Label>
                        <Switch
                          id="apply-compensation"
                          checked={applyCompensationRules}
                          onCheckedChange={setApplyCompensationRules}
                          className="h-4 w-7 [&_span]:size-3 [&_span]:data-[state=checked]:translate-x-3"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                      <Card className="border-emerald-200 bg-emerald-50/30">
                        <CardHeader className="p-4 pb-1">
                          <Label className="text-[10px] font-bold text-emerald-700 uppercase">Produção / Diárias</Label>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="text-xl font-black text-emerald-900">
                            {formatCurrency(data.totals.earnedInCents)}
                          </div>
                          <p className="text-[9px] text-emerald-600 font-medium">Dias trabalhados</p>
                        </CardContent>
                      </Card>

                      <Card className={cn("border-blue-200 transition-all", applyCompensationRules ? "bg-blue-50/30" : "bg-muted/10 opacity-60")}>
                        <CardHeader className="p-4 pb-1">
                          <Label className="text-[10px] font-bold text-blue-700 uppercase">Folgas / Chuva (+)</Label>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className={cn("text-xl font-black transition-colors", applyCompensationRules ? "text-blue-900" : "text-muted-foreground line-through")}>
                            {formatCurrency(data.compensation?.paidLeavesValueInCents || 0)}
                          </div>
                          <p className="text-[9px] text-blue-600 font-medium">
                            {data.compensation?.paidLeavesCount || 0} dia(s) a pagar
                          </p>
                        </CardContent>
                      </Card>

                      <Card className={cn("border-orange-200 transition-all", applyCompensationRules ? "bg-orange-50/30" : "bg-muted/10 opacity-60")}>
                        <CardHeader className="p-4 pb-1">
                          <Label className="text-[10px] font-bold text-orange-700 uppercase">Faltas (-)</Label>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className={cn("text-xl font-black transition-colors", applyCompensationRules ? "text-destructive" : "text-muted-foreground line-through")}>
                            -{formatCurrency(data.compensation?.absencesValueInCents || 0)}
                          </div>
                          <p className="text-[9px] text-orange-600 font-medium">
                            {data.compensation?.absencesCount || 0} dia(s) descontado(s)
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border-red-200 bg-red-50/30">
                        <CardHeader className="p-4 pb-1">
                          <Label className="text-[10px] font-bold text-red-700 uppercase">Adiantamentos (-)</Label>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="text-xl font-black text-red-900">
                            -{formatCurrency(data.totals.advancesInCents)}
                          </div>
                          <p className="text-[9px] text-red-600 font-medium">Vales no período</p>
                        </CardContent>
                      </Card>

                      <Card className="border-primary bg-primary/5">
                        <CardHeader className="p-4 pb-1">
                          <Label className="text-[10px] font-bold text-primary uppercase">Sistema: Líquido</Label>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="text-2xl font-black text-primary">
                            {formatCurrency(data.totals.earnedInCents + (applyCompensationRules ? (data.compensation?.netCompensationInCents || 0) : 0) - data.totals.advancesInCents)}
                          </div>
                          <p className="text-[9px] text-primary/70 font-bold uppercase tracking-tighter">Base para conferência</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                      {/* Formulário de Registro */}
                      <Card className="shadow-lg border-primary/20 flex-1 flex flex-col">
                        <CardHeader className="bg-muted/30 py-3 shrink-0">
                          <CardTitle className="text-sm font-bold flex items-center gap-2">
                            {editingPaymentId ? "Editar Pagamento de Holerite" : "Registrar Pagamento de Holerite"}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4 flex-1">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="paymentDate" className="text-[10px] font-bold uppercase text-muted-foreground">Data do Pagamento</Label>
                              <Input 
                                id="paymentDate"
                                type="date"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                                className="h-9 focus:ring-primary/20"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="holeriteValue" className="text-[10px] font-bold uppercase text-muted-foreground">Valor Líquido (Holerite)</Label>
                              <Input 
                                id="holeriteValue"
                                placeholder="R$ 0,00"
                                value={formatCentsToReal(holeriteValue)}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, "")
                                  setHoleriteValue(Number(value))
                                }}
                                className="h-9 bg-muted/30 focus:ring-1 focus:ring-primary/20 text-sm"
                              />
                            </div>

                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="paymentNotes" className="text-[10px] font-bold uppercase text-muted-foreground">Observações</Label>
                            <Textarea 
                              id="paymentNotes"
                              placeholder="Ex: Pagamento referente à quinzena X de Abril..."
                              value={paymentNotes}
                              onChange={(e) => setPaymentNotes(e.target.value)}
                              className="min-h-[80px] text-sm focus:ring-primary/20"
                            />
                          </div>

                          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 border-dashed border-primary/20">
                            <div className="space-y-0.5">
                              <Label className="text-[10px] font-bold uppercase text-primary">Marcar como Pago</Label>
                              <p className="text-[9px] text-muted-foreground">O pagamento já foi realizado?</p>
                            </div>
                            <Switch 
                              checked={isPaidNow}
                              onCheckedChange={setIsPaidNow}
                              className="data-[state=checked]:bg-primary"
                            />
                          </div>

                          <div className="flex gap-2 pt-2">
                            {editingPaymentId && (
                              <Button 
                                variant="outline" 
                                onClick={handleCancelEdit}
                                className="h-10 font-bold"
                                disabled={isSubmittingPayment}
                              >
                                Cancelar
                              </Button>
                            )}
                            <Button 
                              onClick={handleRegisterPayment} 
                              className="flex-1 h-10 font-bold gap-2"
                              disabled={isSubmittingPayment}
                            >
                              {isSubmittingPayment ? "Salvando..." : (editingPaymentId ? "Atualizar Pagamento" : "Salvar Pagamento")}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Dados Bancários Assistidos e Último Registro */}
                      <div className="space-y-6 flex-1 flex flex-col">
                        <Card className="border-muted shadow-sm overflow-hidden">
                          <CardHeader className="bg-muted/30 py-3 shrink-0">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                              Dados Bancários Selecionados
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4">
                            {data.employee.accounts.length === 0 ? (
                              <div className="text-sm text-muted-foreground py-4">Nenhuma conta cadastrada.</div>
                            ) : (
                              <div className="space-y-3">
                                {data.employee.accounts.map(acc => (
                                  <div key={acc.id} className={cn(
                                    "p-3 rounded-lg border transition-all flex items-center justify-between",
                                    acc.isDefault ? "bg-background border-primary/30 shadow-md" : "bg-background/20 hover:bg-background transition-colors"
                                  )}>
                                    <div className="flex gap-3 items-center min-w-0">
                                      <div className="p-2 rounded-full bg-primary/5 text-primary shrink-0">
                                        {acc.type === "BANCARIA" ? <Landmark className="size-4" /> : <QrCode className="size-4" />}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                          <p className="text-[9px] uppercase font-bold text-muted-foreground leading-none">
                                            {acc.type.replace("PIX_", "").replace("_", " ")}
                                            {acc.isDefault && <span className="text-primary ml-1">(PADRÃO)</span>}
                                          </p>
                                        </div>
                                        <p className="text-sm font-mono font-bold tracking-tight truncate py-0.5">
                                          {formatAccountIdentifier(acc.identifier, acc.type)}
                                        </p>
                                        
                                        {/* Informações adicionais do funcionário */}
                                        {((acc.type === "BANCARIA") || (acc.type === "PIX_TELEFONE")) && (
                                          <div className="mt-1 space-y-0.5">
                                            <p className="text-[9px] font-medium text-muted-foreground truncate uppercase">{data.employee.name}</p>
                                            {data.employee.document && (
                                              <p className="text-[9px] font-mono text-muted-foreground">CPF: {data.employee.document}</p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={() => handleCopy(acc.identifier, "Chave")}
                                      className="size-7 hover:bg-primary/10 hover:text-primary shrink-0"
                                    >
                                      <Copy className="size-3.5" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Último Registro de Pagamento */}
                        {data.details.payments.length > 0 && (
                          <Card className="border-muted shadow-sm overflow-hidden">
                            <CardHeader className="bg-muted/30 py-3 shrink-0 flex flex-row items-center justify-between space-y-0">
                              <CardTitle className="text-sm font-bold flex items-center gap-2">
                                Último Registro de Pagamento
                              </CardTitle>
                              <Badge 
                                variant={data.details.payments[0].isPaid ? "default" : "outline"}
                                className={cn(
                                  "text-[10px] uppercase font-bold px-2 py-0.5",
                                  data.details.payments[0].isPaid ? "bg-green-500 hover:bg-green-600" : "bg-orange-50 text-orange-600 border-orange-200"
                                )}
                              >
                                {data.details.payments[0].isPaid ? "Pago" : "Pendente"}
                              </Badge>
                            </CardHeader>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="text-xl font-black text-primary">
                                    {formatCurrency(data.details.payments[0].holeriteNetInCents)}
                                  </div>
                                  <div className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5 mt-1">
                                    <Calendar className="size-3" /> {format(parseLocalDate(data.details.payments[0].date), "dd/MM/yyyy")}
                                  </div>
                                  {data.details.payments[0].notes && (
                                    <p className="mt-2 text-xs text-muted-foreground italic line-clamp-2">"{data.details.payments[0].notes}"</p>
                                  )}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleTogglePaymentPaid(data.details.payments[0].id, data.details.payments[0].isPaid)}
                                  className={cn(
                                    "h-8 text-[10px] font-bold uppercase gap-2 transition-all",
                                    data.details.payments[0].isPaid 
                                      ? "text-orange-600 border-orange-200 hover:bg-orange-50" 
                                      : "text-green-600 border-green-200 hover:bg-green-50"
                                  )}
                                >
                                  {data.details.payments[0].isPaid ? "Marcar como Pendente" : "Marcar como Pago"}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>

                    {/* Histórico de Pagamentos de Holerite */}
                    <Card className="shadow-md border-muted overflow-hidden">
                      <CardHeader className="bg-muted/30 py-3 border-b">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          Histórico de Pagamentos (Holerite)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/30">
                              <TableHead className="w-[120px]">Data</TableHead>
                              <TableHead className="text-right">Sistema (Bruto)</TableHead>
                              <TableHead className="text-right">Sistema (Líquido)</TableHead>
                              <TableHead className="text-right font-black text-primary">Holerite (Líquido)</TableHead>
                              <TableHead>Obs</TableHead>
                              <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.details.payments.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Nenhum pagamento registrado ainda.</TableCell>
                              </TableRow>
                            ) : (
                              data.details.payments.map((p) => {
                                const diff = p.holeriteNetInCents - p.systemNetInCents
                                const diffPerc = Math.abs(diff / (p.systemNetInCents || 1) * 100)

                                return (
                                  <TableRow key={p.id}>
                                    <TableCell className="font-medium">{format(parseLocalDate(p.date), "dd/MM/yyyy")}</TableCell>
                                    <TableCell className="text-right tabular-nums">{formatCurrency(p.systemBrutoInCents)}</TableCell>
                                    <TableCell className="text-right tabular-nums">{formatCurrency(p.systemNetInCents)}</TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex flex-col items-end">
                                        <span className="font-black text-primary underline underline-offset-2">{formatCurrency(p.holeriteNetInCents)}</span>
                                        {diffPerc > 5 && (
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Badge variant="outline" className="text-[8px] h-3.5 px-0.5 mt-0.5 border-orange-200 text-orange-600 animate-pulse">
                                                  <AlertCircle className="size-2 mr-0.5" /> Divergência {diffPerc.toFixed(0)}%
                                                </Badge>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                A diferença entre o holerite e o sistema é de {formatCurrency(Math.abs(diff))}.
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={p.notes || ""}>{p.notes}</TableCell>
                                    <TableCell>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Abrir menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem 
                                            className="cursor-pointer" 
                                            onClick={() => handleEditPayment(p)}
                                          >
                                            Editar
                                          </DropdownMenuItem>
                                          <DropdownMenuItem 
                                            className="text-destructive cursor-pointer focus:text-destructive focus:bg-destructive/10"
                                            onClick={() => handleDeletePayment(p.id)}
                                          >
                                            Excluir
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </TableCell>
                                  </TableRow>
                                )
                              })
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>
                ) : null}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="pagamentos" className="mt-0 flex-1 min-h-0 overflow-hidden">
              <ScrollArea className="h-full px-6">
                {loading && !data ? (
                  <div className="py-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Skeleton className="h-[400px] w-full" />
                      <Skeleton className="h-[400px] w-full" />
                    </div>
                    <Skeleton className="h-[200px] w-full" />
                  </div>
                ) : data ? (
                  <div className="py-6 space-y-6">
                    {/* Financial Breakdown - Improved Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="border-muted shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/30 py-3 px-4 flex flex-row items-center justify-between space-y-0">
                          <CardTitle className="text-sm font-bold flex items-center gap-2">
                             Produção (Plantio/Corte)
                          </CardTitle>
                          <Badge variant="outline" className="bg-background">{data.details.productions.length} registros</Badge>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="max-h-[400px] overflow-auto px-4">
                            <table className="w-full text-sm">
                              <thead className="sticky top-0 bg-background border-b text-[10px] text-muted-foreground uppercase">
                                <tr>
                                  <th className="text-left py-3">Data</th>
                                  <th className="text-right py-3">Metragem</th>
                                  <th className="text-right py-3">Valor</th>
                                </tr>
                              </thead>
                              <tbody>
                                {data.details.productions.length === 0 ? (
                                  <tr>
                                    <td colSpan={3} className="py-8 text-center text-muted-foreground">Nenhuma produção registrada.</td>
                                  </tr>
                                ) : (
                                  data.details.productions.map((p) => (
                                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                      <td className="py-2.5">{format(parseLocalDate(p.date), "dd/MM")}</td>
                                      <td className="text-right py-2.5">{p.meters?.toString() || "0"}</td>
                                      <td className="text-right py-2.5 font-bold">{formatCurrency(p.totalValueInCents)}</td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-muted shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/30 py-3 px-4 flex flex-row items-center justify-between space-y-0">
                          <CardTitle className="text-sm font-bold flex items-center gap-2">
                             Diárias e Motoristas
                          </CardTitle>
                          <Badge variant="outline" className="bg-background">{data.details.wages.length + data.details.drivers.length} registros</Badge>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="max-h-[400px] overflow-auto px-4">
                            <table className="w-full text-sm">
                              <thead className="sticky top-0 bg-background border-b text-[10px] text-muted-foreground uppercase">
                                <tr>
                                  <th className="text-left py-3">Data</th>
                                  <th className="text-left py-3">Tipo</th>
                                  <th className="text-right py-3">Valor</th>
                                </tr>
                              </thead>
                              <tbody>
                                {data.details.wages.filter(w => w.presence === "PRESENCA").length === 0 && data.details.drivers.length === 0 ? (
                                  <tr>
                                    <td colSpan={3} className="py-8 text-center text-muted-foreground">Nenhuma diária registrada.</td>
                                  </tr>
                                ) : (
                                  <>
                                    {data.details.wages.filter((w) => w.presence === "PRESENCA").map((w) => (
                                      <tr key={w.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                        <td className="py-2.5">{format(parseLocalDate(w.date), "dd/MM")}</td>
                                        <td className="py-2.5 text-[10px] uppercase font-medium">Diária</td>
                                        <td className="text-right py-2.5 font-bold">{formatCurrency(w.valueInCents)}</td>
                                      </tr>
                                    ))}
                                    {data.details.drivers.map((d) => (
                                      <tr key={d.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                        <td className="py-2.5">{format(parseLocalDate(d.date), "dd/MM")}</td>
                                        <td className="py-2.5 text-[10px] uppercase text-orange-600 font-bold">Motorista</td>
                                        <td className="text-right py-2.5 font-bold text-orange-600">{formatCurrency(d.valueInCents)}</td>
                                      </tr>
                                    ))}
                                  </>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Advances - Moved to bottom for more space */}
                    <Card className="border-destructive/20 shadow-sm">
                      <CardHeader className="bg-destructive/5 py-3 px-4 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-bold text-destructive flex items-center gap-2">
                          <DollarSign className="size-4" /> Adiantamentos Efetuados
                        </CardTitle>
                        <div className="text-sm font-black text-destructive">
                          Total: -{formatCurrency(data.totals.advancesInCents)}
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="max-h-[200px] overflow-auto px-4">
                          <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-background border-b text-[10px] text-muted-foreground uppercase">
                              <tr>
                                <th className="text-left py-3">Data</th>
                                <th className="text-left py-3">Conta / Origem</th>
                                <th className="text-right py-3">Valor</th>
                              </tr>
                            </thead>
                            <tbody>
                              {data.details.advances.length === 0 ? (
                                <tr>
                                  <td colSpan={3} className="py-8 text-center text-muted-foreground text-xs">Nenhum adiantamento registrado no período.</td>
                                </tr>
                              ) : (
                                data.details.advances.map((a) => (
                                  <tr key={a.id} className="border-b last:border-0 text-destructive hover:bg-destructive/5 transition-colors">
                                    <td className="py-2.5">{format(parseLocalDate(a.date), "dd/MM/yyyy")}</td>
                                    <td className="py-2.5 text-xs">
                                      <div className="flex items-center gap-2">
                                        <span>{a.account?.identifier ? formatAccountIdentifier(a.account.identifier, a.account.type) : "Conta não vinculada"}</span>
                                        {a.account?.identifier && (
                                          <button 
                                            onClick={() => handleCopy(a.account!.identifier, "Chave PIX")}
                                            className="p-1 rounded hover:bg-destructive/10 text-destructive/50 hover:text-destructive transition-colors"
                                            title="Copiar Chave PIX"
                                          >
                                            <Copy className="size-3" />
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                    <td className="text-right py-2.5 font-bold">-{formatCurrency(a.valueInCents)}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : null}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="frequencia" className="mt-0 flex-1 min-h-0 overflow-hidden relative">
              <ScrollArea className="h-full px-6">
                {loading && !data ? (
                  <div className="py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : data ? (
                  <div className="py-6 pt-6 pb-24">
                    {data.details.presence.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
                        <Calendar className="size-12 opacity-20" />
                        <p className="text-sm">Nenhum registro de frequência encontrado.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {data.details.presence.map((p) => {
                          const dateStr = format(parseLocalDate(p.date), "yyyy-MM-dd")
                          
                          // Locking logic
                          const hasMeterage = data.details.productions.some(pr => format(parseLocalDate(pr.date), "yyyy-MM-dd") === dateStr && (Number(pr.meters) || 0) > 0)
                          const hasWageValue = data.details.wages.some(w => format(parseLocalDate(w.date), "yyyy-MM-dd") === dateStr && w.valueInCents > 0)
                          const hasDriver = data.details.drivers.some(d => format(parseLocalDate(d.date), "yyyy-MM-dd") === dateStr)
                          
                          const locked = hasMeterage || hasWageValue || hasDriver
                          let lockReason = null
                          if (hasDriver) lockReason = "Possui diária de motorista — somente Presença permitida."
                          else if (hasWageValue) lockReason = "Possui diária registrada — somente Presença permitida."
                          else if (hasMeterage) lockReason = "Possui metragem de plantio/corte — somente Presença permitida."

                          const currentStatus = pendingPresenceChanges[dateStr] || p.status as AttendanceType

                          const getStatusInfo = (status: string) => {
                            switch (status) {
                            case "PRESENCA":
                            case "TRABALHADO": 
                              return { icon: <CheckCircle2 className="size-4" />, color: "bg-green-500/10 text-green-700 border-green-200 shadow-sm", label: "Presença" }
                            case "FOLGA": 
                              return { icon: <Calendar className="size-4" />, color: "bg-slate-500/10 text-slate-600 border-slate-200 opacity-80", label: "Folga" }
                            case "FALTA": 
                              return { icon: <XCircle className="size-4" />, color: "bg-red-500/10 text-red-700 border-red-200", label: "Falta" }
                            case "ATESTADO": 
                            case "DECLARACAO":
                              return { icon: <Clock className="size-4" />, color: "bg-blue-500/10 text-blue-700 border-blue-200", label: status === "ATESTADO" ? "Atestado" : "Declaração" }
                            case "FALTA_JUSTIFICADA": 
                              return { icon: <Info className="size-4" />, color: "bg-amber-500/10 text-amber-700 border-amber-200", label: "Justificada" }
                            case "AFASTAMENTO":
                              return { icon: <Info className="size-4" />, color: "bg-purple-500/10 text-purple-700 border-purple-200", label: "Afastado" }
                            default: 
                              return { icon: <Calendar className="size-4" />, color: "bg-muted/50 text-muted-foreground border-muted", label: status }
                            }
                          }
                          const info = getStatusInfo(currentStatus)
                          const isModified = pendingPresenceChanges[dateStr] && pendingPresenceChanges[dateStr] !== p.status

                          const content = (
                            <div key={p.date} className={cn(
                              "p-3 rounded-lg border flex flex-col gap-2 transition-all", 
                              info.color,
                              isModified ? "ring-2 ring-primary ring-offset-1" : ""
                            )}>
                              <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold uppercase tracking-wider">{format(parseLocalDate(p.date), "EEEE", { locale: ptBR })}</span>
                                  <span className="text-lg font-bold">{format(parseLocalDate(p.date), "dd/MM/yyyy")}</span>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  {info.icon}
                                  <span className="text-[10px] font-bold uppercase">{info.label}</span>
                                </div>
                              </div>
                              <Select
                                value={currentStatus}
                                onValueChange={(val: AttendanceType) => {
                                  if (val === p.status) {
                                    const newPending = { ...pendingPresenceChanges }
                                    delete newPending[dateStr]
                                    setPendingPresenceChanges(newPending)
                                  } else {
                                    setPendingPresenceChanges(prev => ({ ...prev, [dateStr]: val }))
                                  }
                                }}
                                disabled={locked}
                              >
                                <SelectTrigger className="h-8 w-full bg-background/50 border-white/20 hover:bg-background/80 transition-colors shadow-sm">
                                  <SelectValue placeholder="Status de Presença" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="PRESENCA">Presente</SelectItem>
                                  <SelectItem value="FALTA" disabled={locked}>Falta</SelectItem>
                                  <SelectItem value="FALTA_JUSTIFICADA" disabled={locked}>Falta Justificada</SelectItem>
                                  <SelectItem value="ATESTADO" disabled={locked}>Atestado</SelectItem>
                                  <SelectItem value="FOLGA" disabled={locked}>Folga</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )

                          if (locked && lockReason) {
                            return (
                              <TooltipProvider key={p.date}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div>{content}</div>
                                  </TooltipTrigger>
                                  <TooltipContent>{lockReason}</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )
                          }

                          return content
                        })}
                      </div>
                    )}
                  </div>
                ) : null}
              </ScrollArea>
              
              {/* Floating Save Button Bar */}
              {Object.keys(pendingPresenceChanges).length > 0 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-background border shadow-xl rounded-full px-6 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-5 fade-in duration-300">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">{Object.keys(pendingPresenceChanges).length} alterações pendentes</span>
                    <span className="text-[10px] text-muted-foreground uppercase">Deseja aplicá-las?</span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="rounded-full"
                      onClick={() => setPendingPresenceChanges({})}
                      disabled={bulkCreateDailyWageMutation.isPending}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      size="sm" 
                      className="rounded-full gap-2"
                      onClick={handleSavePresenceChanges}
                      disabled={bulkCreateDailyWageMutation.isPending}
                    >
                      {bulkCreateDailyWageMutation.isPending ? "Salvando..." : "Salvar Mudanças"}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <ReportSelectionModal 
          open={reportModalOpen}
          onOpenChange={setReportModalOpen}
          employeeId={employeeId}
          employeeName={data?.employee.name || ""}
          seasonId={seasonId}
          initialStartDate={startDate}
          initialEndDate={endDate}
        />
      </DialogContent>
    </Dialog>
  )
}
