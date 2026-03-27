"use client"

import { EmployeeTag } from "@prisma/client"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { ChevronLeft, ChevronRight, FilterX, Lock, Search } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useEmployeeTags } from "@/hooks/use-employee-tags"
import { usePlantingSeasons, useWorkFronts } from "@/hooks/use-planting"
import { apiRequest } from "@/lib/api-client"

import { AdvanceTab } from "./components/AdvanceTab"
import { ClosingTab } from "./components/ClosingTab"
import { DailyWageTab } from "./components/DailyWageTab"
import { DriverTab } from "./components/DriverTab"
import { PlantingTab } from "./components/PlantingTab"
import { PresenceTab } from "./components/PresenceTab"

function AppointmentsContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [selectedSeasonId, setSelectedSeasonId] = useState<string>(searchParams.get("seasonId") || "all")
  const [selectedFrontId, setSelectedFrontId] = useState<string>(searchParams.get("frontId") || "all")
  const [selectedDate, setSelectedDate] = useState<string>(searchParams.get("date") || format(new Date(), "yyyy-MM-dd"))
  const [activeTab, setActiveTab] = useState<string>(searchParams.get("tab") || "plantio")
  const [employeeNameFilter, setEmployeeNameFilter] = useState<string>("")
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)
  
  const today = format(new Date(), "yyyy-MM-dd")
  const hasActiveFilters = 
    selectedSeasonId !== "all" || 
    selectedFrontId !== "all" || 
    selectedDate !== today || 
    employeeNameFilter !== "" || 
    selectedTagId !== null

  const { data: seasons } = usePlantingSeasons()
  const { data: fronts } = useWorkFronts(selectedSeasonId !== "all" ? selectedSeasonId : undefined)
  const { data: tags } = useEmployeeTags()

  // Determine which fortnight the current date belongs to and check if it's closed
  const fortnightRange = (() => {
    if (!selectedDate) return null
    const day = Number(selectedDate.split("-")[2])
    const ym = selectedDate.substring(0, 7) // "YYYY-MM"
    if (day <= 15) {
      return { start: `${ym}-01`, end: `${ym}-15` }
    } else {
      const [y, m] = ym.split("-").map(Number)
      const last = new Date(Date.UTC(y, m, 0)).getUTCDate()
      return { start: `${ym}-16`, end: `${ym}-${String(last).padStart(2, "0")}` }
    }
  })()

  const { data: periodStatus } = useQuery({
    queryKey: ["periodStatus", selectedSeasonId, fortnightRange?.start, fortnightRange?.end],
    queryFn: () => {
      if (selectedSeasonId === "all" || !fortnightRange) return { isClosed: false }
      return apiRequest<{ isClosed: boolean }>(
        `/api/planting/closing?seasonId=${selectedSeasonId}&startDate=${fortnightRange.start}T00:00:00Z&endDate=${fortnightRange.end}T23:59:59Z`
      )
    },
    enabled: selectedSeasonId !== "all" && !!fortnightRange,
  })

  const isPeriodClosed = periodStatus?.isClosed ?? false

  const updateFilters = (season: string, front: string, date: string, tab: string) => {
    const params = new URLSearchParams()
    if (season && season !== "all") params.set("seasonId", season)
    if (front && front !== "all") params.set("frontId", front)
    if (date) params.set("date", date)
    if (tab && tab !== "plantio") params.set("tab", tab)
    
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const handleSeasonChange = (v: string) => {
    setSelectedSeasonId(v)
    setSelectedFrontId("all")
    updateFilters(v, "all", selectedDate, activeTab)
  }

  const handleFrontChange = (v: string) => {
    setSelectedFrontId(v)
    updateFilters(selectedSeasonId, v, selectedDate, activeTab)
  }

  const handleDateChange = (v: string) => {
    setSelectedDate(v)
    updateFilters(selectedSeasonId, selectedFrontId, v, activeTab)
  }

  const handleTabChange = (v: string) => {
    setActiveTab(v)
    updateFilters(selectedSeasonId, selectedFrontId, selectedDate, v)
  }

  const clearFilters = () => {
    const today = format(new Date(), "yyyy-MM-dd")
    setSelectedSeasonId("all")
    setSelectedFrontId("all")
    setSelectedDate(today)
    setActiveTab("plantio")
    setEmployeeNameFilter("")
    setSelectedTagId(null)
    router.replace(pathname, { scroll: false })
  }

  const handleDateStep = (direction: 1 | -1) => {
    const current = new Date(selectedDate + "T12:00:00")
    current.setDate(current.getDate() + direction)
    const newDate = format(current, "yyyy-MM-dd")
    handleDateChange(newDate)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Apontamentos Diários</h2>
          <p className="text-muted-foreground">
            Planilha de controle diário de Plantio, Corte, Diárias, Motoristas e Área.
          </p>
        </div>

        <div className="flex items-center gap-4">
          {isPeriodClosed && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 border border-amber-200 text-amber-900 rounded-md font-semibold text-sm">
              <Lock className="h-4 w-4" />
              Quinzena fechada.
            </div>
          )}
        </div>
      </div>

      <Card className="relative overflow-visible">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Safra</Label>
              <Select
                value={selectedSeasonId}
                onValueChange={handleSeasonChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a Safra" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {seasons?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Frente de Trabalho</Label>
              <Select
                value={selectedFrontId}
                onValueChange={handleFrontChange}
                disabled={selectedSeasonId === "all"}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a Frente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Frentes</SelectItem>
                  {fronts?.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data Base do Apontamento</Label>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={() => handleDateStep(-1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={() => handleDateStep(1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-10 mt-4 items-end">
            <div className="space-y-2 lg:col-span-6">
              <Label>Buscar Funcionário</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Nome do funcionário"
                  className="pl-8"
                  value={employeeNameFilter}
                  onChange={(e) => setEmployeeNameFilter(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2 lg:col-span-4">
              <Label>Filtrar por Etiquetas</Label>
              <Select
                value={selectedTagId || 'all'}
                onValueChange={(v) => setSelectedTagId(v === 'all' ? null : v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas as etiquetas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as etiquetas</SelectItem>
                  {tags?.map((tag: EmployeeTag) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="size-2 rounded-full" 
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.name}
                      </div>
                    </SelectItem>
                  ))}
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

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-6 h-12">
          <TabsTrigger value="plantio" className="text-sm">Plantio & Corte</TabsTrigger>
          <TabsTrigger value="diaria" className="text-sm">Diárias</TabsTrigger>
          <TabsTrigger value="motorista" className="text-sm">Motoristas (Frota)</TabsTrigger>
          <TabsTrigger value="presenca" className="text-sm">Presença/Faltas</TabsTrigger>
          <TabsTrigger value="adiantamento" className="text-sm">Adiantamentos</TabsTrigger>
          <TabsTrigger value="area" className="text-sm">Fechamento</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="plantio" className="m-0">
            <PlantingTab
              seasonId={selectedSeasonId}
              frontId={selectedFrontId}
              date={selectedDate}
              employeeNameFilter={employeeNameFilter}
              onEmployeeFilterChange={setEmployeeNameFilter}
              selectedTagIds={selectedTagId ? [selectedTagId] : []}
              isPeriodClosed={isPeriodClosed}
            />
          </TabsContent>
          <TabsContent value="diaria" className="m-0">
            <DailyWageTab
              seasonId={selectedSeasonId}
              frontId={selectedFrontId}
              date={selectedDate}
              employeeNameFilter={employeeNameFilter}
              onEmployeeFilterChange={setEmployeeNameFilter}
              selectedTagIds={selectedTagId ? [selectedTagId] : []}
              isPeriodClosed={isPeriodClosed}
            />
          </TabsContent>
          <TabsContent value="motorista" className="m-0">
            <DriverTab
              seasonId={selectedSeasonId}
              frontId={selectedFrontId}
              date={selectedDate}
              selectedTagIds={selectedTagId ? [selectedTagId] : []}
            />
          </TabsContent>
          <TabsContent value="area" className="m-0">
            <ClosingTab
              seasonId={selectedSeasonId}
              frontId={selectedFrontId}
              date={selectedDate}
            />
          </TabsContent>
          <TabsContent value="presenca" className="m-0">
            <PresenceTab
              seasonId={selectedSeasonId}
              frontId={selectedFrontId}
              date={selectedDate}
              employeeNameFilter={employeeNameFilter}
              onEmployeeFilterChange={setEmployeeNameFilter}
              selectedTagIds={selectedTagId ? [selectedTagId] : []}
              isPeriodClosed={isPeriodClosed}
            />
          </TabsContent>
          <TabsContent value="adiantamento" className="m-0">
            <AdvanceTab
              seasonId={selectedSeasonId}
              frontId={selectedFrontId}
              date={selectedDate}
              employeeNameFilter={employeeNameFilter}
              onEmployeeFilterChange={setEmployeeNameFilter}
              selectedTagIds={selectedTagId ? [selectedTagId] : []}
              isPeriodClosed={isPeriodClosed}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

export default function AppointmentsPage() {
  return (
    <Suspense>
      <AppointmentsContent />
    </Suspense>
  )
}
