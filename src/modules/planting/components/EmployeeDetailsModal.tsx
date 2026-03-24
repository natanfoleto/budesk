"use client"

import { 
  endOfMonth,
  format,
  startOfMonth} from "date-fns"
import { ptBR } from "date-fns/locale"
import { 
  Calendar, 
  CheckCircle2, 
  Clock,
  Copy,
  DollarSign, 
  Info,
  Landmark,
  QrCode,
  TrendingUp, 
  XCircle
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { 
  Bar,
  BarChart,
  CartesianGrid, 
  Legend,
  Line, 
  LineChart, 
  ResponsiveContainer,
  Tooltip, 
  XAxis, 
  YAxis
} from "recharts"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiRequest } from "@/lib/api-client"
import { formatAccountIdentifier, parseLocalDate } from "@/lib/utils"

import { EmployeeSummary } from "../services/PlantingEmployeeService"

interface EmployeeDetailsModalProps {
  employeeId: string | null
  seasonId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

type FilterType = "GERAL" | "HOJE" | "P_QUINZENAL" | "S_QUINZENAL" | "MES_ATUAL" | "CUSTOM"

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
    } else {
      setData(null)
    }
  }, [open, employeeId, fetchData])

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

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] max-h-[95vh] sm:max-w-none flex flex-col p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-6 border-b shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                {loading && !data ? <Skeleton className="h-8 w-64" /> : data?.employee.name || "Carregando..."}
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
                    <SelectItem value="GERAL">Geral</SelectItem>
                    <SelectItem value="HOJE">Hoje</SelectItem>
                    <SelectItem value="P_QUINZENAL">Primeira quinzena (01-15)</SelectItem>
                    <SelectItem value="S_QUINZENAL">Segunda quinzena (16-31)</SelectItem>
                    <SelectItem value="MES_ATUAL">Mês Atual</SelectItem>
                    <SelectItem value="CUSTOM">Personalizado</SelectItem>
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
                <TabsTrigger value="pagamentos" className="flex-1 px-4 py-2 text-xs font-semibold rounded-md data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Financeiro</TabsTrigger>
                <TabsTrigger value="frequencia" className="flex-1 px-4 py-2 text-xs font-semibold rounded-md data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Presença / Faltas</TabsTrigger>
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
                      <Card className="bg-primary/5 border-primary/20">
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <DollarSign className="size-3" /> TOTAL GANHO
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="text-2xl font-bold">{formatCurrency(data.totals.earnedInCents)}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <CheckCircle2 className="size-3" /> DIAS TRABALHADOS
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="text-2xl font-bold">{data.totals.daysWorked} <span className="text-sm font-normal text-muted-foreground">dias</span></div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <XCircle className="size-3 text-destructive" /> TOTAL FALTAS
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="text-2xl font-bold text-destructive">{data.totals.absences} <span className="text-sm font-normal text-muted-foreground">faltas</span></div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
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
                      <Card className="lg:col-span-2">
                        <CardHeader>
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <TrendingUp className="size-4 text-primary" /> Evolução de Ganhos Diários
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[250px]">
                          {data.insights.gainEvolution.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-sm text-muted-foreground italic">
                              Sem dados de evolução no período selecionado.
                            </div>
                          ) : (
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={data.insights.gainEvolution}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis 
                                  dataKey="date" 
                                  fontSize={10}
                                  tickFormatter={(val) => format(parseLocalDate(val), "dd/MM", { locale: ptBR })}
                                />
                                <YAxis 
                                  fontSize={10}
                                  tickFormatter={(val) => `R$ ${val / 100}`}
                                />
                                <Tooltip 
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

                      {/* PIX / Accounts */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Landmark className="size-4 text-primary" /> Contas para Pagamento
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {data.employee.accounts.length === 0 ? (
                            <div className="text-center py-4 text-sm text-muted-foreground flex flex-col items-center gap-2">
                              <Info className="size-8 opacity-20" />
                              Nenhuma conta cadastrada no perfil do funcionário.
                            </div>
                          ) : (
                            data.employee.accounts.map((acc) => (
                              <div key={acc.id} className="p-3 rounded-lg border bg-muted/20 relative overflow-hidden group">
                                {acc.isDefault && (
                                  <div className="absolute top-0 right-0 h-2 w-2 rounded-bl-full bg-primary" />
                                )}
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-full bg-primary/10 text-primary">
                                      {acc.type === "BANCARIA" ? <Landmark className="size-4" /> : <QrCode className="size-4" />}
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{acc.type.replace("_", " ")}</p>
                                      <p className="text-sm font-mono font-bold break-all leading-tight">
                                        {formatAccountIdentifier(acc.identifier)}
                                      </p>
                                      {acc.description && <p className="text-[10px] text-muted-foreground italic">{acc.description}</p>}
                                    </div>
                                  </div>
                                  <button 
                                    onClick={() => handleCopy(acc.identifier, acc.type === "BANCARIA" ? "Dados bancários" : "Chave PIX")}
                                    className="p-1.5 cursor-pointer rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                                    title="Copiar"
                                  >
                                    <Copy className="size-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))
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
                    {/* Productivity Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-semibold">Produção por Dia (Metros)</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
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
                                  tickFormatter={(val) => format(parseLocalDate(val), "dd/MM", { locale: ptBR })}
                                />
                                <YAxis fontSize={10} />
                                <Tooltip 
                                  labelFormatter={(label) => format(parseLocalDate(label), "dd 'de' MMM", { locale: ptBR })}
                                />
                                <Legend wrapperStyle={{ fontSize: 10 }} />
                                <Bar dataKey="planting" name="Plantio" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="cutting" name="Corte" fill="#f97316" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          )}
                        </CardContent>
                      </Card>

                      <div className="space-y-4">
                        <Card>
                          <CardHeader className="p-4">
                            <CardTitle className="text-sm text-muted-foreground">MELHOR DIA</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            {data.insights.mostProductiveDay ? (
                              <div className="flex items-center justify-between">
                                <div className="text-2xl font-bold">{data.insights.mostProductiveDay.meters} <span className="text-sm font-normal">m</span></div>
                                <Badge variant="secondary">{format(parseLocalDate(data.insights.mostProductiveDay.date), "dd 'de' MMM", { locale: ptBR })}</Badge>
                              </div>
                            ) : "Sem dados"}
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="p-4">
                            <CardTitle className="text-sm text-muted-foreground">MÉDIA DIÁRIA DE PLANTIO</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0 text-2xl font-bold">
                            {data.averages.dailyPlantingMeters.toFixed(1)} <span className="text-sm font-normal">m/dia</span>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="p-4">
                            <CardTitle className="text-sm text-muted-foreground">TOTAL METROS PLANTADOS</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0 text-2xl font-bold">
                            {data.totals.plantingMeters.toLocaleString()} <span className="text-sm font-normal">m</span>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
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
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                          <CardTitle className="text-sm font-semibold">Produção (Plantio/Corte)</CardTitle>
                          <Badge variant="outline">{data.details.productions.length} registros</Badge>
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
                                    <td colSpan={3} className="py-8 text-center text-muted-foreground italic">Nenhuma produção registrada.</td>
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

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                          <CardTitle className="text-sm font-semibold">Diárias e Motoristas</CardTitle>
                          <Badge variant="outline">{data.details.wages.length + data.details.drivers.length} registros</Badge>
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
                                    <td colSpan={3} className="py-8 text-center text-muted-foreground italic">Nenhuma diária registrada.</td>
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
                                        <span>{a.account?.identifier ? formatAccountIdentifier(a.account.identifier) : "Conta não vinculada"}</span>
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

            <TabsContent value="frequencia" className="mt-0 flex-1 min-h-0 overflow-hidden">
              <ScrollArea className="h-full px-6">
                {loading && !data ? (
                  <div className="py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : data ? (
                  <div className="py-6 pt-6 pb-12">
                    {data.details.presence.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
                        <Calendar className="size-12 opacity-20" />
                        <p>Nenhum registro de frequência encontrado.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {data.details.presence.map((p) => {
                          const getStatusInfo = (status: string) => {
                            switch (status) {
                            case "TRABALHADO": return { icon: <CheckCircle2 className="size-4" />, color: "bg-green-100 text-green-700 border-green-200", label: "Presença" }
                            case "FALTA": return { icon: <XCircle className="size-4" />, color: "bg-red-100 text-red-700 border-red-200", label: "Falta" }
                            case "ATESTADO": return { icon: <Clock className="size-4" />, color: "bg-blue-100 text-blue-700 border-blue-200", label: "Atestado" }
                            case "FALTA_JUSTIFICADA": return { icon: <Info className="size-4" />, color: "bg-yellow-100 text-yellow-700 border-yellow-200", label: "Justificada" }
                            default: return { icon: <Calendar className="size-4" />, color: "bg-muted text-muted-foreground", label: status }
                            }
                          }
                          const info = getStatusInfo(p.status)
                          return (
                            <div key={p.date} className={`p-3 rounded-lg border flex items-center justify-between ${info.color}`}>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold uppercase tracking-wider">{format(parseLocalDate(p.date), "EEEE", { locale: ptBR })}</span>
                                <span className="text-lg font-bold">{format(parseLocalDate(p.date), "dd/MM/yyyy")}</span>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                {info.icon}
                                <span className="text-[10px] font-bold uppercase">{info.label}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ) : null}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

      </DialogContent>
    </Dialog>
  )
}
