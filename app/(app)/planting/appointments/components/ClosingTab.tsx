"use client"

import { FileText, Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  useDailyWages, 
  useDriverAllocations, 
  usePlantingAdvances,
  usePlantingParameters, 
  usePlantingProductions, 
} from "@/hooks/use-planting"
import { cn, formatCentsToReal } from "@/lib/utils"
import { DailyWage, DriverAllocation, PlantingAdvance, PlantingProduction } from "@/types/planting"

interface ClosingTabProps {
  seasonId: string
  frontId: string
  date: string
}

export function ClosingTab({ seasonId, frontId, date }: ClosingTabProps) {
  const { data: parameters } = usePlantingParameters()
  
  // Ratios for hectares
  const areaPlantioRatio = parameters?.find(p => p.key === "area_hectare_plantio")?.value ? Number(parameters?.find(p => p.key === "area_hectare_plantio")?.value) : 834
  const areaCorteRatio = parameters?.find(p => p.key === "area_hectare_corte")?.value ? Number(parameters?.find(p => p.key === "area_hectare_corte")?.value) : 1333
  
  // Prices for cost calculation
  const defaultPlantingPrice = parameters?.find(p => p.key === "valor_m_plantio")?.value ? Number(parameters?.find(p => p.key === "valor_m_plantio")?.value) : 0
  const defaultCuttingPrice = parameters?.find(p => p.key === "valor_m_corte")?.value ? Number(parameters?.find(p => p.key === "valor_m_corte")?.value) : 0

  // 1. Productions
  const { data: dailyProductions, isLoading: loadingDailyProd } = usePlantingProductions({
    seasonId,
    frontId,
    date: date ? `${date}T00:00:00Z` : undefined
  })
  const { data: cumulativeProductions, isLoading: loadingCumProd } = usePlantingProductions({
    seasonId,
    frontId
  })

  // 2. Daily Wages
  const { data: dailyWages, isLoading: loadingDailyWages } = useDailyWages({
    seasonId,
    frontId,
    date: date ? `${date}T00:00:00Z` : undefined
  })
  const { data: cumulativeWages, isLoading: loadingCumWages } = useDailyWages({
    seasonId,
    frontId
  })

  // 3. Driver Allocations
  const { data: dailyDrivers, isLoading: loadingDailyDrivers } = useDriverAllocations({
    seasonId,
    frontId,
    date: date ? `${date}T00:00:00Z` : undefined
  })
  const { data: cumulativeDrivers, isLoading: loadingCumDrivers } = useDriverAllocations({
    seasonId,
    frontId
  })

  // 4. Advances
  const { data: dailyAdvances, isLoading: loadingDailyAdvances } = usePlantingAdvances({
    seasonId,
    frontId,
    date: date ? `${date}T00:00:00Z` : undefined
  })
  const { data: cumulativeAdvances, isLoading: loadingCumAdvances } = usePlantingAdvances({
    seasonId,
    frontId
  })

  const [isGenerating, setIsGenerating] = useState(false)

  const isLoading = loadingDailyProd || loadingCumProd || loadingDailyWages || loadingCumWages || loadingDailyDrivers || loadingCumDrivers || loadingDailyAdvances || loadingCumAdvances

  // --- Range Logic ---
  const [yearStr, monthStr, dayStr] = date.split("-")
  const day = Number(dayStr)
  const month = Number(monthStr) - 1 // 0-based month
  const year = Number(yearStr)

  const pad = (n: number) => n.toString().padStart(2, '0')
  
  const fnStart = day <= 15 ? 1 : 16
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate()
  const fnEnd = day <= 15 ? 15 : lastDayOfMonth
  
  const startOfFortnightStr = `${year}-${pad(month + 1)}-${pad(fnStart)}`
  const endOfFortnightStr = `${year}-${pad(month + 1)}-${pad(fnEnd)}`
  const startOfMonthStr = `${year}-${pad(month + 1)}-01`
  const endOfMonthStr = `${year}-${pad(month + 1)}-${pad(lastDayOfMonth)}`

  const isWithin = (dateStr: string | undefined | null, start: string, end: string) => {
    if (!dateStr) return false
    const d = dateStr.split("T")[0].replace(/\//g, "-")
    return d >= start && d <= end
  }

  // --- Aggregation Helpers ---
  const getProductionsMetrics = (data: PlantingProduction[]) => {
    const p = data.filter(x => x.type === "PLANTIO" && x.presence === "PRESENCA")
    const c = data.filter(x => x.type === "CORTE" && x.presence === "PRESENCA")
    
    const pMeters = p.reduce((acc, curr) => acc + Number(curr.meters || 0), 0)
    const cMeters = c.reduce((acc, curr) => acc + Number(curr.meters || 0), 0)
    
    const pCost = p.reduce((acc, curr) => acc + (curr.totalValueInCents || (Number(curr.meters || 0) * defaultPlantingPrice)), 0)
    const cCost = c.reduce((acc, curr) => acc + (curr.totalValueInCents || (Number(curr.meters || 0) * defaultCuttingPrice)), 0)
    
    return {
      plantingMeters: pMeters,
      cuttingMeters: cMeters,
      plantingHectares: pMeters / areaPlantioRatio,
      cuttingHectares: cMeters / areaCorteRatio,
      plantingCost: pCost,
      cuttingCost: cCost,
      totalCost: pCost + cCost
    }
  }

  const getWagesMetrics = (data: DailyWage[]) => {
    const withValue = data.filter(w => (w.valueInCents || 0) > 0)
    const totalCost = data.reduce((acc, curr) => acc + (curr.valueInCents || 0), 0)
    return {
      count: withValue.length,
      cost: totalCost,
      absences: data.filter(w => w.presence === "FALTA").length,
      justified: data.filter(w => w.presence === "FALTA_JUSTIFICADA").length,
      medical: data.filter(w => w.presence === "ATESTADO").length,
      folga: data.filter(w => w.presence === "FOLGA").length
    }
  }

  const getDriversMetrics = (data: DriverAllocation[]) => {
    const totalCost = data.reduce((acc, curr) => acc + (curr.valueInCents || 0), 0)
    return {
      count: data.length, // All driver entries count? Or only those > 0? Let's keep all for now as usually they are assigned.
      cost: totalCost
    }
  }

  const getAdvancesMetrics = (data: PlantingAdvance[]) => {
    const totalCost = data.reduce((acc, curr) => acc + (curr.valueInCents || 0), 0)
    return {
      count: data.length,
      cost: totalCost
    }
  }

  const handleDownloadReport = async () => {
    setIsGenerating(true)
    try {
      const params = new URLSearchParams({
        type: 'closing',
        seasonId,
        startDate: startOfFortnightStr,
        endDate: endOfFortnightStr
      })

      const response = await fetch(`/api/planting/reports?${params.toString()}`)
      if (!response.ok) {
        // We still use fetch for blobs, but we should manually handle 401
        if (response.status === 401) {
          // This will be caught by the global interceptor if we were using apiRequest, 
          // but for direct fetch we might need to throw a compatible error.
          // However, apiRequest currently doesn't support returning blobs easily 
          // without changing its signature.
          // Let's at least throw a generic error that might be caught or just rely on the next interaction.
          // Better: let's use a small wrapper or just check the code.
        }
        throw new Error("Erro ao gerar relatório")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `fechamento_plantio_${startOfFortnightStr}_${endOfFortnightStr}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success("Relatório gerado com sucesso!")
    } catch (error: unknown) {
      console.error(error)
      toast.error("Erro ao baixar relatório")
    } finally {
      setIsGenerating(false)
    }
  }

  // TODAY
  const todayProd = getProductionsMetrics((dailyProductions as PlantingProduction[]) || [])
  const todayWages = getWagesMetrics((dailyWages as DailyWage[]) || [])
  const todayDrivers = getDriversMetrics((dailyDrivers as DriverAllocation[]) || [])
  const todayAdvances = getAdvancesMetrics((dailyAdvances as PlantingAdvance[]) || [])

  // CUMULATIVE
  const generalProd = getProductionsMetrics((cumulativeProductions as PlantingProduction[]) || [])
  const generalWages = getWagesMetrics((cumulativeWages as DailyWage[]) || [])
  const generalDrivers = getDriversMetrics((cumulativeDrivers as DriverAllocation[]) || [])
  const generalAdvances = getAdvancesMetrics((cumulativeAdvances as PlantingAdvance[]) || [])

  // Periods
  const fnProductions = ((cumulativeProductions as PlantingProduction[]) || []).filter((p: PlantingProduction) => isWithin(p.date, startOfFortnightStr, endOfFortnightStr))
  const fnWages = ((cumulativeWages as DailyWage[]) || []).filter((w: DailyWage) => isWithin(w.date, startOfFortnightStr, endOfFortnightStr))
  const fnDrivers = ((cumulativeDrivers as DriverAllocation[]) || []).filter((d: DriverAllocation) => isWithin(d.date, startOfFortnightStr, endOfFortnightStr))
  const fnAdvances = ((cumulativeAdvances as PlantingAdvance[]) || []).filter((a: PlantingAdvance) => isWithin(a.date, startOfFortnightStr, endOfFortnightStr))

  const fnMetrics = {
    prod: getProductionsMetrics(fnProductions),
    wages: getWagesMetrics(fnWages),
    drivers: getDriversMetrics(fnDrivers),
    advances: getAdvancesMetrics(fnAdvances)
  }

  const mProductions = (cumulativeProductions || []).filter((p: PlantingProduction) => isWithin(p.date, startOfMonthStr, endOfMonthStr))
  const mWages = (cumulativeWages || []).filter((w: DailyWage) => isWithin(w.date, startOfMonthStr, endOfMonthStr))
  const mDrivers = (cumulativeDrivers || []).filter((d: DriverAllocation) => isWithin(d.date, startOfMonthStr, endOfMonthStr))
  const mAdvances = (cumulativeAdvances || []).filter((a: PlantingAdvance) => isWithin(a.date, startOfMonthStr, endOfMonthStr))

  const mMetrics = {
    prod: getProductionsMetrics(mProductions),
    wages: getWagesMetrics(mWages),
    drivers: getDriversMetrics(mDrivers),
    advances: getAdvancesMetrics(mAdvances)
  }

  const SectionHeader = ({ title, icon, bgClass = "text-muted-foreground" }: { title: string, icon?: React.ReactNode, bgClass?: string }) => (
    <div className={cn("col-span-full border-b pb-1.5 pt-1.5 px-2 flex items-center gap-2 rounded-t-md", bgClass)}>
      <span className="text-xs font-bold uppercase tracking-widest">{title}</span>
      {icon}
    </div>
  )

  const MetricGroup = ({ title, daily, general, isCurrency = false, isHectare = false, isMeter = false }: { title: string, daily: number, general: number, isCurrency?: boolean, isHectare?: boolean, isMeter?: boolean }) => (
    <Card className="py-3 gap-0 overflow-hidden border-none bg-muted/20 shadow-none">
      <CardHeader className="px-1.5 py-0">
        <CardTitle className="text-[11px] font-semibold text-muted-foreground uppercase">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-1.5 py-0">
        <div className="flex flex-col">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Hoje</span>
            <span className="text-sm font-bold">
              {isCurrency ? formatCentsToReal(daily) : daily.toLocaleString("pt-BR", { minimumFractionDigits: isHectare ? 2 : 0, maximumFractionDigits: isHectare ? 2 : 0 })}
              {isHectare ? " ha" : isMeter ? " m" : ""}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-muted/20 mt-1 pt-1 opacity-80">
            <span className="text-[10px] text-muted-foreground">Geral</span>
            <span className="text-[11px] font-semibold">
              {isCurrency ? formatCentsToReal(general) : general.toLocaleString("pt-BR", { minimumFractionDigits: isHectare ? 2 : 0, maximumFractionDigits: isHectare ? 2 : 0 })}
              {isHectare ? " ha" : isMeter ? " m" : ""}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (seasonId === "all" || frontId === "all" || !date) {
    return (
      <Card>
        <CardContent className="flex h-40 items-center justify-center text-muted-foreground p-6">
          Selecione a Safra, Frente de Trabalho e Data acima para ver o Fechamento.
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center gap-2 text-muted-foreground border rounded-lg bg-muted/10">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando dados de fechamento...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-primary/20 bg-primary/5 py-3">
        <CardHeader className="px-3 py-1">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            Custos (Resumo Financeiro)
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: "Hoje", val: todayProd.totalCost + todayWages.cost + todayDrivers.cost + todayAdvances.cost },
              { label: "Quinzena", val: fnMetrics.prod.totalCost + fnMetrics.wages.cost + fnMetrics.drivers.cost + fnMetrics.advances.cost },
              { label: "Mês", val: mMetrics.prod.totalCost + mMetrics.wages.cost + mMetrics.drivers.cost + mMetrics.advances.cost },
              { label: "Geral", val: generalProd.totalCost + generalWages.cost + generalDrivers.cost + generalAdvances.cost },
            ].map((item) => (
              <div key={item.label} className="flex flex-col px-3 py-1 rounded-lg bg-background/50 border border-primary/10">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">{item.label}</span>
                <span className="text-xl font-black text-primary">
                  {formatCentsToReal(item.val)}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-3">
            Soma de: Custo Plantio + Custo Corte + Diárias + Motoristas + Adiantamentos.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-10">
        <div className="space-y-1">
          <SectionHeader title="Plantio & Corte" bgClass="bg-emerald-100/50 text-emerald-900 border-emerald-200" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-1.5">
            <MetricGroup title="Custo (Est.) Plantio" daily={todayProd.plantingCost} general={generalProd.plantingCost} isCurrency />
            <MetricGroup title="Custo (Est.) Corte" daily={todayProd.cuttingCost} general={generalProd.cuttingCost} isCurrency />
            <MetricGroup title="Total Metragem Plantio" daily={todayProd.plantingMeters} general={generalProd.plantingMeters} isMeter />
            <MetricGroup title="Total Metragem Corte" daily={todayProd.cuttingMeters} general={generalProd.cuttingMeters} isMeter />
            <MetricGroup title="Área Plantio (Hec.)" daily={todayProd.plantingHectares} general={generalProd.plantingHectares} isHectare />
            <MetricGroup title="Área Corte (Hec.)" daily={todayProd.cuttingHectares} general={generalProd.cuttingHectares} isHectare />
          </div>
        </div>

        <div className="space-y-1">
          <SectionHeader title="Diárias & Motoristas" bgClass="bg-orange-100/50 text-orange-900 border-orange-200" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-1.5">
            <MetricGroup title="Total Diárias" daily={todayWages.count} general={generalWages.count} />
            <MetricGroup title="Total Diárias Motoristas" daily={todayDrivers.count} general={generalDrivers.count} />
            <MetricGroup title="Custo (Est.) Diárias" daily={todayWages.cost} general={generalWages.cost} isCurrency />
            <MetricGroup title="Custo (Est.) Motoristas" daily={todayDrivers.cost} general={generalDrivers.cost} isCurrency />
          </div>
        </div>

        <div className="space-y-1">
          <SectionHeader title="Presença / Faltas" bgClass="bg-blue-100/50 text-blue-900 border-blue-200" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-1.5">
            <MetricGroup title="Total Presenças" daily={todayWages.count} general={generalWages.count} />
            <MetricGroup title="Total Faltas" daily={todayWages.absences} general={generalWages.absences} />
            <MetricGroup title="Total Faltas Just." daily={todayWages.justified} general={generalWages.justified} />
            <MetricGroup title="Total Atestados" daily={todayWages.medical} general={generalWages.medical} />
            <MetricGroup title="Dias de Folga" daily={todayWages.folga} general={generalWages.folga} />
          </div>
        </div>

        <div className="space-y-1">
          <SectionHeader title="Adiantamentos" bgClass="bg-red-100/50 text-red-900 border-red-200" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-1.5">
            <MetricGroup title="Total Adiantamentos" daily={todayAdvances.count} general={generalAdvances.count} />
            <MetricGroup title="Custo (Est.) Adiantamentos" daily={todayAdvances.cost} general={generalAdvances.cost} isCurrency />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end px-1">
        <Button 
          variant="default"
          className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 gap-2"
          onClick={handleDownloadReport}
          disabled={isGenerating}
        >
          {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
          Gerar Relatório PDF
        </Button>
      </div>
    </div>
  )
}
