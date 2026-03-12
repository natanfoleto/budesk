"use client"

import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

import { AreaTab } from "./components/AreaTab"
import { DailyWageTab } from "./components/DailyWageTab"
import { DriverTab } from "./components/DriverTab"
// We will import subcomponents here later
import { PlantingTab } from "./components/PlantingTab"

export default function AppointmentsPage() {
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("all")
  const [selectedFrontId, setSelectedFrontId] = useState<string>("all")
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))

  const { data: seasons } = useQuery({
    queryKey: ["plantingSeasons"],
    queryFn: async () => {
      const res = await fetch("/api/planting/seasons")
      return res.json()
    }
  })

  const { data: fronts } = useQuery({
    queryKey: ["workFronts", selectedSeasonId],
    queryFn: async () => {
      if (!selectedSeasonId || selectedSeasonId === "all") return []
      const res = await fetch(`/api/planting/work-fronts?seasonId=${selectedSeasonId}`)
      return res.json()
    },
    enabled: selectedSeasonId !== "all"
  })

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
              <Select value={selectedSeasonId} onValueChange={(v) => { setSelectedSeasonId(v); setSelectedFrontId("all") }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a Safra" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {seasons?.map((s: { id: string; name: string }) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 flex-1 min-w-[200px]">
              <Label>Frente de Trabalho</Label>
              <Select value={selectedFrontId} onValueChange={setSelectedFrontId} disabled={selectedSeasonId === "all"}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a Frente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Frentes</SelectItem>
                  {fronts?.map((f: { id: string; name: string }) => (
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
          <TabsTrigger value="plantio" className="text-base">Plantio & Corte</TabsTrigger>
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
            <Card>
              <CardHeader>
                <CardTitle>Controle de Presença (Faltas/Atestados)</CardTitle>
              </CardHeader>
              <CardContent>
                 Em desenvolvimento. Funcionalidade de marcação rápida de faltas para não processar na folha.
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
