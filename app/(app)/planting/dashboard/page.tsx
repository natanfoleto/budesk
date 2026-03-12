"use client"

import { useQuery } from "@tanstack/react-query"
import { Calendar,DollarSign, LayoutDashboard, Tractor } from "lucide-react"
import { useEffect,useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

export default function PlantingDashboardPage() {
  const [selectedSeason, setSelectedSeason] = useState<string>("")

  // Fetch seasons
  const { data: seasons } = useQuery({
    queryKey: ["plantingSeasons"],
    queryFn: async () => {
      const res = await fetch("/api/planting/seasons")
      if (!res.ok) throw new Error("Failed to fetch seasons")
      return res.json()
    }
  })

  // Set initial selected season
  useEffect(() => {
    if (seasons && seasons.length > 0 && !selectedSeason) {
      const active = seasons.find((s: { id: string; active: boolean }) => s.active)
      if (active) setSelectedSeason(active.id)
      else setSelectedSeason(seasons[0].id)
    }
  }, [seasons, selectedSeason])

  // Fetch metrics for selected season
  const { data: metrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ["plantingDashboard", selectedSeason],
    queryFn: async () => {
      if (!selectedSeason) return null
      const res = await fetch(`/api/planting/dashboard?seasonId=${selectedSeason}`)
      if (!res.ok) throw new Error("Failed to fetch metrics")
      return res.json()
    },
    enabled: !!selectedSeason
  })

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(cents / 100)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard de Plantio</h2>
          <p className="text-muted-foreground">
            Visão geral de produções, custos e áreas trabalhadas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">Safra/Período:</p>
          <Select value={selectedSeason} onValueChange={setSelectedSeason}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selecione uma safra" />
            </SelectTrigger>
            <SelectContent>
              {seasons?.map((season: { id: string; name: string; active: boolean }) => (
                <SelectItem key={season.id} value={season.id}>
                  {season.name} {season.active ? "(Ativa)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedSeason || isLoadingMetrics ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[120px] w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(metrics?.totalCostInCents || 0)}
                </div>
                <p className="text-xs text-muted-foreground">Consolidado da safra editável</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Área Trabalhada</CardTitle>
                <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.totalHectares || 0} ha
                </div>
                <p className="text-xs text-muted-foreground">Hectares concluídos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Custo por Hectare</CardTitle>
                <Tractor className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(metrics?.costPerHectareInCents || 0)}
                </div>
                <p className="text-xs text-muted-foreground">Indicador de performance</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Metragem Produzida</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.totalMeters || 0} m
                </div>
                <p className="text-xs text-muted-foreground">Soma de apontamentos</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Composição de Custos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Plantão / Produção</span>
                    <span>{formatCurrency(metrics?.breakdown?.productions || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Diárias</span>
                    <span>{formatCurrency(metrics?.breakdown?.wages || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Motoristas (Frota)</span>
                    <span>{formatCurrency(metrics?.breakdown?.allocations || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Gastos Operacionais</span>
                    <span>{formatCurrency(metrics?.breakdown?.expenses || 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
