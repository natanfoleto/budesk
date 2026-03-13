"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { endOfMonth, format, setDate,startOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { AlertTriangle, CalendarCheck,Lock } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter,CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { usePlantingDashboard, usePlantingSeasons } from "@/hooks/use-planting"
import { formatCurrency } from "@/lib/utils"

export default function PlantingClosingPage() {
  const queryClient = useQueryClient()
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("")
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"))
  const [selectedPeriod, setSelectedPeriod] = useState<"1-15" | "16-end">("1-15")

  const { data: seasons, isLoading: isLoadingSeasons } = usePlantingSeasons()
  const { data: dashboardData, isLoading: isLoadingSummary } = usePlantingDashboard(selectedSeasonId)

  // Auto-select active season
  if (seasons && !selectedSeasonId) {
    const active = seasons.find((s) => s.active)
    if (active) setSelectedSeasonId(active.id)
    else if (seasons.length > 0) setSelectedSeasonId(seasons[0].id)
  }

  const closePeriodMutation = useMutation({
    mutationFn: async () => {
      const baseDate = new Date(`${selectedMonth}-01T12:00:00Z`)
      let startDateStr, endDateStr

      if (selectedPeriod === "1-15") {
        startDateStr = format(startOfMonth(baseDate), "yyyy-MM-dd")
        endDateStr = format(setDate(baseDate, 15), "yyyy-MM-dd")
      } else {
        startDateStr = format(setDate(baseDate, 16), "yyyy-MM-dd")
        endDateStr = format(endOfMonth(baseDate), "yyyy-MM-dd")
      }

      const res = await fetch("/api/planting/closing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seasonId: selectedSeasonId,
          startDate: `${startDateStr}T00:00:00Z`,
          endDate: `${endDateStr}T23:59:59Z`,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Falha ao fechar o período")
      }
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries()
      toast.success(data.message || "Período fechado com sucesso.")
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const handleClose = () => {
    if (confirm("Você tem certeza que deseja realizar o fechamento desta quinzena? Após o fechamento, os apontamentos (plantio, corte, área, diárias, gastos e motoristas) deste período NÃO poderão mais ser alterados ou excluídos.")) {
      closePeriodMutation.mutate()
    }
  }

  const monthOptions = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    return {
      value: format(d, "yyyy-MM"),
      label: format(d, "MMMM yyyy", { locale: ptBR }),
    }
  })

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Fechamento Quinzenal</h2>
          <p className="text-muted-foreground">
            Bata os valores do período e trave as edições de apontamentos.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Período</CardTitle>
            <CardDescription>
              Defina a safra, mês e quinzena que deseja realizar o fechamento (trava de registros).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Safra</Label>
              {isLoadingSeasons ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a Safra" />
                  </SelectTrigger>
                  <SelectContent>
                    {seasons?.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label>Mês de Referência</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o Mês" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="capitalize">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quinzena</Label>
              <Select value={selectedPeriod} onValueChange={(v: "1-15" | "16-end") => setSelectedPeriod(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a Quinzena" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-15">1ª Quinzena (Dias 01 ao 15)</SelectItem>
                  <SelectItem value="16-end">2ª Quinzena (Dia 16 ao fim do mês)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Atenção</AlertTitle>
              <AlertDescription className="text-xs">
                Esta ação é irreversível através do painel. Qualquer correção após o fechamento exigirá intervenção de um administrador no banco de dados.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              variant="destructive"
              onClick={handleClose}
              disabled={!selectedSeasonId || closePeriodMutation.isPending}
            >
              <Lock className="h-4 w-4" />
              {closePeriodMutation.isPending ? "Processando Fechamento..." : "Realizar Fechamento"}
            </Button>
          </CardFooter>
        </Card>

        {/* Resumo da Safra */}
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarCheck className="h-5 w-5" />
              Resumo Geral da Safra Selecionada
            </CardTitle>
            <CardDescription>
              Valores acumulados em tempo real até o momento. Verifique no dashboard principal para mais detalhes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : !dashboardData ? (
              <div className="text-center text-muted-foreground p-4">Selecione uma safra válida.</div>
            ) : (
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Custo Total Acumulado</p>
                  <p className="text-3xl font-bold tracking-tight">{formatCurrency(dashboardData.totalCostInCents)}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Área Plantada (ha)</p>
                    <p className="text-xl font-semibold">{Number(dashboardData.totalHectares).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Custo por Hectare</p>
                    <p className="text-xl font-semibold">{formatCurrency(dashboardData.costPerHectareInCents)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Metragem (Plantio)</p>
                    <p className="text-xl font-semibold">{Number(dashboardData.totalPlantingMeters).toFixed(0)}m</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Metragem (Corte)</p>
                    <p className="text-xl font-semibold">{Number(dashboardData.totalCuttingMeters).toFixed(0)}m</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
