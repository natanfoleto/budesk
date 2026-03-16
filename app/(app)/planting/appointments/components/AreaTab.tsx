"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { usePlantingParameters, usePlantingProductions } from "@/hooks/use-planting"

interface AreaTabProps {
  seasonId: string
  frontId: string
  date: string
}

export function AreaTab({ seasonId, frontId, date }: AreaTabProps) {
  const { data: parameters } = usePlantingParameters()
  const areaPlantioRatio = parameters?.find(p => p.key === "area_hectare_plantio")?.value ? Number(parameters?.find(p => p.key === "area_hectare_plantio")?.value) : 834
  const areaCorteRatio = parameters?.find(p => p.key === "area_hectare_corte")?.value ? Number(parameters?.find(p => p.key === "area_hectare_corte")?.value) : 1333

  // Active day productions to track the exact metrics
  const { data: dailyProductions } = usePlantingProductions({
    seasonId,
    frontId,
    date: date ? `${date}T00:00:00Z` : undefined
  })

  // Cumulative productions to track all inputs in the front
  const { data: cumulativeProductions } = usePlantingProductions({
    seasonId,
    frontId
  })

  const dailyPlantioMeters = dailyProductions?.filter((p: { type: string, presence: string, meters: string | number | null }) => p.type === "PLANTIO" && p.presence === "PRESENCA").reduce((acc: number, curr: { meters: string | number | null }) => acc + Number(curr.meters || 0), 0) || 0
  const dailyCorteMeters = dailyProductions?.filter((p: { type: string, presence: string, meters: string | number | null }) => p.type === "CORTE" && p.presence === "PRESENCA").reduce((acc: number, curr: { meters: string | number | null }) => acc + Number(curr.meters || 0), 0) || 0
  
  const dailyPlantioHectares = dailyPlantioMeters / areaPlantioRatio
  const dailyCorteHectares = dailyCorteMeters / areaCorteRatio
  const computedDailyHectares = Number((dailyPlantioHectares + dailyCorteHectares).toFixed(2))

  const totalPlantioMeters = cumulativeProductions?.filter((p: { type: string, presence: string, meters: string | number | null }) => p.type === "PLANTIO" && p.presence === "PRESENCA").reduce((acc: number, curr: { meters: string | number | null }) => acc + Number(curr.meters || 0), 0) || 0
  const totalCorteMeters = cumulativeProductions?.filter((p: { type: string, presence: string, meters: string | number | null }) => p.type === "CORTE" && p.presence === "PRESENCA").reduce((acc: number, curr: { meters: string | number | null }) => acc + Number(curr.meters || 0), 0) || 0

  const totalPlantioHectares = totalPlantioMeters / areaPlantioRatio
  const totalCorteHectares = totalCorteMeters / areaCorteRatio
  const computedTotalHectares = Number((totalPlantioHectares + totalCorteHectares).toFixed(2))

  if (seasonId === "all" || frontId === "all" || !date) {
    return (
      <Card>
        <CardContent className="flex h-40 items-center justify-center text-muted-foreground p-6">
          Selecione a Safra, Frente de Trabalho e Data acima para gerenciar a Área Trabalhada.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Hectares Plantio (Hoje)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dailyPlantioHectares.toFixed(2)} ha</div>
            <p className="text-xs text-muted-foreground mt-1">Base/ha: {areaPlantioRatio}m</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Hectares Corte (Hoje)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dailyCorteHectares.toFixed(2)} ha</div>
            <p className="text-xs text-muted-foreground mt-1">Base/ha: {areaCorteRatio}m</p>
          </CardContent>
        </Card>

        <Card className="bg-muted/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total (Hoje)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{computedDailyHectares.toFixed(2)} ha</div>
            <p className="text-xs text-muted-foreground mt-1">Soma de Plantio e Corte</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600">Total Plantio (Acumulado)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPlantioHectares.toFixed(2)} ha</div>
            <p className="text-xs text-muted-foreground mt-1">Todos os dias da frente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600">Total Corte (Acumulado)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCorteHectares.toFixed(2)} ha</div>
            <p className="text-xs text-muted-foreground mt-1">Todos os dias da frente</p>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 dark:bg-emerald-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600">Total Área (Acumulado)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{computedTotalHectares.toFixed(2)} ha</div>
            <p className="text-xs text-emerald-600/70 mt-1">Acumulado Total</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
