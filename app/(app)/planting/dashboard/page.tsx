"use client"

import { Calendar, DollarSign, FileText, LayoutDashboard, Loader2, LucideIcon, Tractor, TrendingUp } from "lucide-react"
import { useEffect, useState } from "react"
import { 
  Area, 
  AreaChart, 
  Bar, 
  BarChart, 
  CartesianGrid, 
  Legend, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis 
} from "recharts"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  usePlantingDashboard, 
  usePlantingDashboardCharts, 
  usePlantingDashboardPeriods, 
  usePlantingSeasons 
} from "@/hooks/use-planting"
import { formatCurrency } from "@/lib/utils"

export default function PlantingDashboardPage() {
  const [selectedSeason, setSelectedSeason] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const { data: seasons } = usePlantingSeasons()
  const { data: metrics, isLoading: isLoadingMetrics } = usePlantingDashboard(selectedSeason)
  const { data: periodMetrics, isLoading: isLoadingPeriods } = usePlantingDashboardPeriods(selectedSeason)
  const { data: chartData, isLoading: isLoadingCharts } = usePlantingDashboardCharts(selectedSeason, 30)

  useEffect(() => {
    if (seasons && seasons.length > 0 && !selectedSeason) {
      const active = seasons.find((s) => s.active)
      if (active) setSelectedSeason(active.id)
      else setSelectedSeason(seasons[0].id)
    }
  }, [seasons, selectedSeason])

  const handleDownloadReport = async () => {
    if (!selectedSeason) return
    setIsGenerating(true)
    try {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      
      const params = new URLSearchParams({
        type: 'closing',
        seasonId: selectedSeason,
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      })

      const response = await fetch(`/api/planting/reports?${params.toString()}`)
      if (!response.ok) throw new Error("Erro ao gerar relatório")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `fechamento_dashboard_${selectedSeason}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success("Relatório gerado com sucesso!")
    } catch (error) {
      console.error(error)
      toast.error("Erro ao baixar relatório")
    } finally {
      setIsGenerating(false)
    }
  }

  const isLoading = isLoadingMetrics || isLoadingPeriods || isLoadingCharts

  const CustomMetricCard = ({ title, value, subtext, icon: Icon, colorClass = "text-muted-foreground" }: { 
    title: string; 
    value: string; 
    subtext: string; 
    icon: LucideIcon; 
    colorClass?: string 
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${colorClass}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{subtext}</p>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard Plantio Manual</h2>
          <p className="text-muted-foreground">
            Visão geral de produções, custos e áreas trabalhadas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedSeason} onValueChange={setSelectedSeason}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Selecione uma safra" />
            </SelectTrigger>
            <SelectContent>
              {seasons?.map((season) => (
                <SelectItem key={season.id} value={season.id}>
                  {season.name} {season.active ? "(Ativa)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            variant="default" 
            className="bg-emerald-600 hover:bg-emerald-700 h-10 gap-2"
            onClick={handleDownloadReport}
            disabled={isGenerating || !selectedSeason}
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Gerar Relatório
          </Button>
        </div>
      </div>

      {!selectedSeason || isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[120px] w-full" />)}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Skeleton className="col-span-4 h-[400px]" />
            <Skeleton className="col-span-3 h-[400px]" />
          </div>
        </div>
      ) : (
        <>
          {/* Section 1: Financial Periods */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Resumo Financeiro</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <CustomMetricCard 
                title="Custo Hoje" 
                value={formatCurrency(periodMetrics?.today?.totalCostInCents ?? 0)} 
                subtext="Custo total de hoje"
                icon={DollarSign}
                colorClass="text-emerald-600"
              />
              <CustomMetricCard 
                title="Custo Quinzena" 
                value={formatCurrency(periodMetrics?.fortnight?.totalCostInCents ?? 0)} 
                subtext="Custo na quinzena atual"
                icon={TrendingUp}
                colorClass="text-blue-600"
              />
              <CustomMetricCard 
                title="Custo Mês" 
                value={formatCurrency(periodMetrics?.month?.totalCostInCents ?? 0)} 
                subtext="Custo total do mês"
                icon={Calendar}
                colorClass="text-violet-600"
              />
              <CustomMetricCard 
                title="Custo Geral" 
                value={formatCurrency(periodMetrics?.general?.totalCostInCents ?? 0)} 
                subtext="Total acumulado na safra"
                icon={LayoutDashboard}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <CustomMetricCard 
              title="Área Total (Geral)" 
              value={`${(metrics?.totalHectares ?? 0).toFixed(2)} ha`} 
              subtext="Hectares trabalhados na safra"
              icon={LayoutDashboard}
            />
            <CustomMetricCard 
              title="Custo por Hectare" 
              value={formatCurrency(metrics?.costPerHectareInCents ?? 0)} 
              subtext="Consolidado da safra"
              icon={Tractor}
            />
            <CustomMetricCard 
              title="Metragem Total" 
              value={`${(metrics?.totalMeters ?? 0).toLocaleString()} m`}
              subtext="Soma de plantio e corte"
              icon={TrendingUp}
            />
            <CustomMetricCard 
              title="Produção de Plantio" 
              value={`${(metrics?.totalPlantingMeters ?? 0).toLocaleString()} m`}
              subtext="Apenas metragem de plantio"
              icon={Calendar}
            />
          </div>

          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {/* Chart: Daily Costs */}
            <Card>
              <CardHeader>
                <CardTitle>Evolução de Custos (30 dias)</CardTitle>
                <CardDescription>Custo total diário consolidado</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {isMounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(val) => val.split('-').slice(1).reverse().join('/')} 
                        fontSize={10}
                      />
                      <YAxis 
                        tickFormatter={(val) => `R$${(val / 100).toFixed(0)}`} 
                        fontSize={10}
                      />
                      <Tooltip 
                        labelFormatter={(val) => `Data: ${typeof val === 'string' ? val.split('-').reverse().join('/') : val}`}
                        formatter={(val: number | string | readonly (number | string)[] | undefined) => [formatCurrency(Number(Array.isArray(val) ? val[0] : (val || 0))), "Custo Total"]}
                      />
                      <Area type="monotone" dataKey="cost" stroke="#10b981" fillOpacity={1} fill="url(#colorCost)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Chart: Daily Production */}
            <Card>
              <CardHeader>
                <CardTitle>Produção Diária (30 dias)</CardTitle>
                <CardDescription>Metragem de Plantio vs Corte</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {isMounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(val) => val.split('-').slice(1).reverse().join('/')} 
                        fontSize={10}
                      />
                      <YAxis fontSize={10} />
                      <Tooltip 
                        labelFormatter={(val) => `Data: ${typeof val === 'string' ? val.split('-').reverse().join('/') : val}`}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="planting" name="Plantio (m)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="cutting" name="Corte (m)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          
          <Card className="col-span-full lg:col-span-4">
            <CardHeader>
              <CardTitle>Composição de Custos</CardTitle>
              <CardDescription>Detalhamento por categoria na safra atual</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-sm font-medium">Plantio</span>
                  <span className="font-bold">{formatCurrency(metrics?.breakdown?.planting ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-sm font-medium">Corte</span>
                  <span className="font-bold">{formatCurrency(metrics?.breakdown?.cutting ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-sm font-medium">Diárias</span>
                  <span className="font-bold">{formatCurrency(metrics?.breakdown?.wages ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-sm font-medium">Motoristas (Frota)</span>
                  <span className="font-bold">{formatCurrency(metrics?.breakdown?.allocations ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-sm font-medium">Gastos Operacionais</span>
                  <span className="font-bold">{formatCurrency(metrics?.breakdown?.expenses ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-lg font-bold">Total Geral</span>
                  <span className="text-lg font-black text-emerald-600">{formatCurrency(metrics?.totalCostInCents ?? 0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
