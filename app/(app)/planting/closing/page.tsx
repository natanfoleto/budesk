"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { endOfMonth, format, setDate, startOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarCheck, FileText, Lock, LockOpen } from "lucide-react"
import { useState } from "react"
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
import { useUser } from "@/hooks/use-user"
import { formatCurrency } from "@/lib/utils"

import { ReportModal } from "../appointments/components/ReportModal"

export default function PlantingClosingPage() {
  const queryClient = useQueryClient()
  const { data: currentUser } = useUser()
  const isAdminOrRoot = currentUser?.role === "ROOT" || currentUser?.role === "ADMIN"
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("")
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"))
  const [selectedPeriod, setSelectedPeriod] = useState<"1-15" | "16-end">("1-15")
  const [pendingAction, setPendingAction] = useState<"fechar" | "reabrir" | null>(null)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  const { data: seasons, isLoading: isLoadingSeasons } = usePlantingSeasons()
  
  // Auto-select active season
  if (seasons && !selectedSeasonId) {
    const active = seasons.find((s) => s.active)
    if (active) setSelectedSeasonId(active.id)
    else if (seasons.length > 0) setSelectedSeasonId(seasons[0].id)
  }

  const buildDates = () => {
    const baseDate = new Date(`${selectedMonth}-01T12:00:00Z`)
    let startDateStr, endDateStr
    if (selectedPeriod === "1-15") {
      startDateStr = format(startOfMonth(baseDate), "yyyy-MM-dd")
      endDateStr = format(setDate(baseDate, 15), "yyyy-MM-dd")
    } else {
      startDateStr = format(setDate(baseDate, 16), "yyyy-MM-dd")
      endDateStr = format(endOfMonth(baseDate), "yyyy-MM-dd")
    }
    return { startDateStr, endDateStr }
  }

  const { startDateStr, endDateStr } = buildDates()

  // Hooks for summaries
  const { data: seasonSummary, isLoading: isLoadingSeasonSummary } = usePlantingDashboard(selectedSeasonId)
  const { data: periodSummary, isLoading: isLoadingPeriodSummary } = usePlantingDashboard(
    selectedSeasonId,
    { startDate: startDateStr, endDate: endDateStr }
  )

  // Check if the selected period is already closed
  const { data: periodStatus, isLoading: isCheckingStatus } = useQuery({
    queryKey: ["periodStatus", selectedSeasonId, selectedMonth, selectedPeriod],
    queryFn: async () => {
      if (!selectedSeasonId) return { isClosed: false, isMonthClosed: false }
      const [year, month] = selectedMonth.split("-")
      const res = await fetch(
        `/api/planting/closing?seasonId=${selectedSeasonId}&startDate=${startDateStr}T00:00:00Z&endDate=${endDateStr}T23:59:59Z&checkMonth=${month}&year=${year}`
      )
      if (!res.ok) return { isClosed: false, isMonthClosed: false }
      return res.json() as Promise<{ isClosed: boolean; isMonthClosed: boolean }>
    },
    enabled: !!selectedSeasonId,
  })

  const isClosed = periodStatus?.isClosed ?? false

  const closePeriodMutation = useMutation({
    mutationFn: async () => {
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

  const reopenPeriodMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/planting/reopen", {
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
        throw new Error(errorData.error || "Falha ao reabrir o período")
      }
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries()
      toast.success(data.message || "Período reaberto com sucesso.")
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const handleClose = () => setPendingAction("fechar")
  const handleReopen = () => setPendingAction("reabrir")

  const handleConfirm = () => {
    if (pendingAction === "fechar") closePeriodMutation.mutate()
    else if (pendingAction === "reabrir") reopenPeriodMutation.mutate()
    setPendingAction(null)
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
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Fechamento</h2>
          <p className="text-muted-foreground">
            Bata os valores do período e trave as edições de apontamentos.
          </p>
        </div>

        <div className="flex items-center gap-4">
          {isClosed && selectedSeasonId && (
            <Button 
              onClick={() => setIsReportModalOpen(true)}
              variant="default"
              className="bg-emerald-600 hover:bg-emerald-700 font-semibold"
            >
              <FileText className="h-4 w-4" />
              Gerar Relatórios PDF
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Card 1: Seleção de Período */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Selecionar Período</CardTitle>
            <CardDescription>
              Defina a quinzena que deseja gerenciar.
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

          </CardContent>
          <CardFooter>
            {isCheckingStatus ? (
              <Skeleton className="h-9 w-full" />
            ) : isClosed ? (
              isAdminOrRoot ? (
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleReopen}
                  disabled={!selectedSeasonId || reopenPeriodMutation.isPending}
                >
                  <LockOpen className="h-4 w-4" />
                  {reopenPeriodMutation.isPending ? "Reabrindo..." : "Reabrir Período"}
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground w-full text-center">Somente administradores podem reabrir.</p>
              )
            ) : (
              <Button
                className="w-full"
                variant="destructive"
                onClick={handleClose}
                disabled={!selectedSeasonId || closePeriodMutation.isPending}
              >
                <Lock className="h-4 w-4" />
                {closePeriodMutation.isPending ? "Processando..." : "Realizar Fechamento"}
              </Button>
            )}
          </CardFooter>
        </Card>

        <div className="lg:col-span-2 grid gap-6">
          {/* Card 2: Resumo da Quinzena */}
          <Card className={isClosed ? "border-amber-200 bg-amber-50/10" : "bg-muted/30"}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="h-5 w-5 text-primary" />
                  Resumo da Quinzena
                </div>
                {isClosed ? (
                  <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-semibold border border-amber-200 uppercase">
                    Resumo Final (Fechado)
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full font-semibold border border-green-200 uppercase">
                    Até o Momento (Aberto)
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                Métricas detalhadas para o período de {startDateStr} até {endDateStr}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPeriodSummary ? (
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : !periodSummary ? (
                <div className="text-center text-muted-foreground p-4 text-sm italic">Nenhum dado encontrado para este período.</div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    <div className="col-span-2 sm:col-span-1">
                      <p className="text-sm font-medium text-muted-foreground">Custo no Período</p>
                      <p className="text-3xl font-bold tracking-tight text-primary">{formatCurrency(periodSummary.totalCostInCents)}</p>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <p className="text-sm font-medium text-muted-foreground">Área Trabalhada</p>
                      <p className="text-3xl font-bold tracking-tight">{Number(periodSummary.totalHectares).toFixed(2)} ha</p>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                        Metragem Plantio
                      </p>
                      <p className="text-xl font-semibold">{Number(periodSummary.totalPlantingMeters).toLocaleString()}m</p>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                        Metragem Corte
                      </p>
                      <p className="text-xl font-semibold">{Number(periodSummary.totalCuttingMeters).toLocaleString()}m</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 4: Resumo do Mês (NEW) */}
          <Card className={periodStatus?.isMonthClosed ? "border-emerald-200 bg-emerald-50/10" : "bg-muted/30 border-dashed"}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="h-5 w-5 text-emerald-600" />
                  Acumulado Geral do Mês
                </div>
                {periodStatus?.isMonthClosed ? (
                  <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-semibold border border-emerald-200 uppercase">
                    Mês Fechado
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-semibold border border-gray-200 uppercase">
                    Pendente / Parcial
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                Consolidado das duas quinzenas do mês.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPeriodSummary ? (
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : !periodSummary ? (
                <div className="text-center text-muted-foreground p-4 text-sm italic">Nenhum dado encontrado para este mês.</div>
              ) : (
                <div className="space-y-6">
                  <MonthlyMetrics seasonId={selectedSeasonId} monthStr={selectedMonth} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 3: Resumo da Safra */}
          <Card className="border-dashed border-muted-foreground/20">
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                Acumulado Geral da Safra
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingSeasonSummary ? (
                <div className="grid grid-cols-3 gap-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : !seasonSummary ? (
                <div className="text-center text-muted-foreground p-2 text-xs">Selecione uma safra válida.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Custo Total</p>
                    <p className="text-sm font-bold">{formatCurrency(seasonSummary.totalCostInCents)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Total Área</p>
                    <p className="text-sm font-bold">{Number(seasonSummary.totalHectares).toFixed(2)} ha</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Plantio</p>
                    <p className="text-sm font-bold">{Number(seasonSummary.totalPlantingMeters / 1000).toFixed(1)} km</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Corte</p>
                    <p className="text-sm font-bold">{Number(seasonSummary.totalCuttingMeters / 1000).toFixed(1)} km</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={pendingAction !== null} onOpenChange={(open) => { if (!open) setPendingAction(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction === "fechar" ? "Fechar Período" : "Reabrir Período"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction === "fechar"
                ? "Após o fechamento, os apontamentos deste período NÃO poderão mais ser alterados. Tem certeza?"
                : "Os apontamentos voltarão a ser editáveis. Tem certeza que deseja reabrir este período?"
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant={pendingAction === "fechar" ? "destructive" : "default"}
              className={pendingAction === "reabrir" ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
              onClick={handleConfirm}
            >
              {pendingAction === "fechar" ? "Sim, fechar período" : "Sim, reabrir período"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedSeasonId && (
        <ReportModal 
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          seasonId={selectedSeasonId}
          startDate={startDateStr}
          endDate={endDateStr}
          isMonthClosed={periodStatus?.isMonthClosed}
          monthStr={selectedMonth}
        />
      )}
    </div>
  )
}

function MonthlyMetrics({ seasonId, monthStr }: { seasonId: string, monthStr: string }) {
  const baseDate = new Date(`${monthStr}-01T12:00:00Z`)
  const startDate = format(startOfMonth(baseDate), "yyyy-MM-dd")
  const endDate = format(endOfMonth(baseDate), "yyyy-MM-dd")

  const { data: metrics, isLoading } = usePlantingDashboard(seasonId, { startDate, endDate })

  if (isLoading) return <div className="grid grid-cols-2 gap-4"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
  if (!metrics) return null

  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
      <div className="col-span-2 sm:col-span-1">
        <p className="text-sm font-medium text-muted-foreground">Custo Total no Mês</p>
        <p className="text-2xl font-bold tracking-tight text-emerald-700">{formatCurrency(metrics.totalCostInCents)}</p>
      </div>
      <div className="col-span-2 sm:col-span-1">
        <p className="text-sm font-medium text-muted-foreground">Área Total no Mês</p>
        <p className="text-2xl font-bold tracking-tight">{Number(metrics.totalHectares).toFixed(2)} ha</p>
      </div>
      <div className="pt-2 border-t border-border">
        <p className="text-[10px] font-bold text-muted-foreground uppercase">Plantio</p>
        <p className="text-lg font-semibold">{Number(metrics.totalPlantingMeters).toLocaleString()}m</p>
      </div>
      <div className="pt-2 border-t border-border">
        <p className="text-[10px] font-bold text-muted-foreground uppercase">Corte</p>
        <p className="text-lg font-semibold">{Number(metrics.totalCuttingMeters).toLocaleString()}m</p>
      </div>
    </div>
  )
}
