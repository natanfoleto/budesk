"use client"

import { format } from "date-fns"
import { ChevronLeft, ChevronRight, FilterX, Search } from "lucide-react"
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
import { usePlantingSeasons, useWorkFronts } from "@/hooks/use-planting"

import { AreaTab } from "./components/AreaTab"
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

  const { data: seasons } = usePlantingSeasons()
  const { data: fronts } = useWorkFronts(selectedSeasonId !== "all" ? selectedSeasonId : undefined)

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
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2 flex-1 min-w-[200px]">
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

            <div className="space-y-2 flex-1 min-w-[200px]">
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

            <div className="space-y-2 flex-1 min-w-[200px]">
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

            <div className="space-y-2 flex-1 min-w-[200px]">
              <Label>Buscar Funcionário</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Nome do funcionário..."
                  className="pl-8"
                  value={employeeNameFilter}
                  onChange={(e) => setEmployeeNameFilter(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col justify-end">
              <Label className="invisible select-none text-sm">.</Label>
              <Button variant="outline" onClick={clearFilters} className="text-muted-foreground w-full">
                <FilterX className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-12">
          <TabsTrigger value="plantio" className="text-base">Plantio &amp; Corte</TabsTrigger>
          <TabsTrigger value="diaria" className="text-base">Diárias</TabsTrigger>
          <TabsTrigger value="motorista" className="text-base">Motoristas (Frota)</TabsTrigger>
          <TabsTrigger value="presenca" className="text-base">Presença/Faltas</TabsTrigger>
          <TabsTrigger value="area" className="text-base">Controle de Área (ha)</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="plantio" className="m-0">
            <PlantingTab
              seasonId={selectedSeasonId}
              frontId={selectedFrontId}
              date={selectedDate}
              employeeNameFilter={employeeNameFilter}
            />
          </TabsContent>
          <TabsContent value="diaria" className="m-0">
            <DailyWageTab
              seasonId={selectedSeasonId}
              frontId={selectedFrontId}
              date={selectedDate}
              employeeNameFilter={employeeNameFilter}
            />
          </TabsContent>
          <TabsContent value="motorista" className="m-0">
            <DriverTab
              seasonId={selectedSeasonId}
              frontId={selectedFrontId}
              date={selectedDate}
            />
          </TabsContent>
          <TabsContent value="area" className="m-0">
            <AreaTab
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
