"use client"

import { format } from "date-fns"
import { useState } from "react"

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

export default function AppointmentsPage() {
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("all")
  const [selectedFrontId, setSelectedFrontId] = useState<string>("all")
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"))

  const { data: seasons } = usePlantingSeasons()
  const { data: fronts } = useWorkFronts(selectedSeasonId !== "all" ? selectedSeasonId : undefined)

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
                onValueChange={(v) => { setSelectedSeasonId(v); setSelectedFrontId("all") }}
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
                onValueChange={setSelectedFrontId}
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
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="plantio" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-12">
          <TabsTrigger value="plantio" className="text-base">Plantio &amp; Corte</TabsTrigger>
          <TabsTrigger value="diaria" className="text-base">Diárias</TabsTrigger>
          <TabsTrigger value="motorista" className="text-base">Motoristas (Frota)</TabsTrigger>
          <TabsTrigger value="area" className="text-base">Controle de Área (ha)</TabsTrigger>
          <TabsTrigger value="presenca" className="text-base">Presença/Faltas</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="plantio" className="m-0">
            <PlantingTab
              seasonId={selectedSeasonId}
              frontId={selectedFrontId}
              date={selectedDate}
            />
          </TabsContent>
          <TabsContent value="diaria" className="m-0">
            <DailyWageTab
              seasonId={selectedSeasonId}
              frontId={selectedFrontId}
              date={selectedDate}
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
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
