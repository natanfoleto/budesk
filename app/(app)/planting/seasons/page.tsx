"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Calendar, Edit, Plus, Target, Users } from "lucide-react"
import { useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription,CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

type Season = {
  id: string
  name: string
  startDate: string
  endDate: string
  active: boolean
  totalArea: number | null
  plannedCostInCents: number | null
  notes: string | null
}

type WorkFront = {
  id: string
  seasonId: string
  name: string
  description: string | null
  startDate: string
  endDate: string | null
  active: boolean
}

export default function PlantingSeasonsPage() {
  const queryClient = useQueryClient()
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null)
  
  // Modals state
  const [isSeasonModalOpen, setIsSeasonModalOpen] = useState(false)
  const [isFrontModalOpen, setIsFrontModalOpen] = useState(false)
  
  // Forms state
  const [seasonForm, setSeasonForm] = useState<Partial<Season>>({})
  const [frontForm, setFrontForm] = useState<Partial<WorkFront>>({})

  // Fetch Seasons
  const { data: seasons, isLoading: isLoadingSeasons } = useQuery({
    queryKey: ["plantingSeasons"],
    queryFn: async () => {
      const res = await fetch("/api/planting/seasons")
      if (!res.ok) throw new Error("Failed to fetch seasons")
      return res.json() as Promise<Season[]>
    }
  })

  // Fetch Work Fronts for Selected Season
  const { data: workFronts, isLoading: isLoadingFronts } = useQuery({
    queryKey: ["workFronts", selectedSeasonId],
    queryFn: async () => {
      if (!selectedSeasonId) return []
      const res = await fetch(`/api/planting/work-fronts?seasonId=${selectedSeasonId}`)
      if (!res.ok) throw new Error("Failed to fetch work fronts")
      return res.json() as Promise<WorkFront[]>
    },
    enabled: !!selectedSeasonId
  })

  // Mutations
  const createSeasonMutation = useMutation({
    mutationFn: async (data: Partial<Season>) => {
      const res = await fetch("/api/planting/seasons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error("Failed to create season")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plantingSeasons"] })
      setIsSeasonModalOpen(false)
      setSeasonForm({})
    }
  })

  const updateSeasonMutation = useMutation({
    mutationFn: async (data: Partial<Season>) => {
      const res = await fetch(`/api/planting/seasons/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error("Failed to update season")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plantingSeasons"] })
      setIsSeasonModalOpen(false)
      setSeasonForm({})
    }
  })

  const createFrontMutation = useMutation({
    mutationFn: async (data: Partial<WorkFront>) => {
      const res = await fetch("/api/planting/work-fronts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, seasonId: selectedSeasonId })
      })
      if (!res.ok) throw new Error("Failed to create work front")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workFronts", selectedSeasonId] })
      setIsFrontModalOpen(false)
      setFrontForm({})
    }
  })

  const handleSaveSeason = () => {
    // Format dates to ISO strings if needed
    const payload = {
      ...seasonForm,
      startDate: seasonForm.startDate ? new Date(seasonForm.startDate).toISOString() : undefined,
      endDate: seasonForm.endDate ? new Date(seasonForm.endDate).toISOString() : undefined,
      totalArea: seasonForm.totalArea ? Number(seasonForm.totalArea) : null,
      plannedCostInCents: seasonForm.plannedCostInCents ? Number(seasonForm.plannedCostInCents) * 100 : null,
    }

    if (seasonForm.id) {
      updateSeasonMutation.mutate(payload)
    } else {
      createSeasonMutation.mutate(payload)
    }
  }

  const handleSaveFront = () => {
    const payload = {
      ...frontForm,
      startDate: frontForm.startDate ? new Date(frontForm.startDate).toISOString() : undefined,
      endDate: frontForm.endDate ? new Date(frontForm.endDate).toISOString() : undefined,
    }
    createFrontMutation.mutate(payload)
  }

  const openEditSeason = (season: Season) => {
    setSeasonForm({
      ...season,
      startDate: season.startDate ? new Date(season.startDate).toISOString().split('T')[0] : '',
      endDate: season.endDate ? new Date(season.endDate).toISOString().split('T')[0] : '',
      plannedCostInCents: season.plannedCostInCents ? season.plannedCostInCents / 100 : 0
    })
    setIsSeasonModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Safras e Frentes de Trabalho</h2>
          <p className="text-muted-foreground">
            Gerencie as safras, períodos e cadastre frentes de trabalho para o plantio manual.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Safras cadastradas</CardTitle>
              <CardDescription>Selecione uma safra para ver os detalhes</CardDescription>
            </div>
            <Dialog open={isSeasonModalOpen} onOpenChange={setIsSeasonModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => setSeasonForm({ active: false })}>
                  <Plus className="mr-2 h-4 w-4" /> Nova
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{seasonForm.id ? "Editar Safra" : "Nova Safra"}</DialogTitle>
                  <DialogDescription>
                    Digite os detalhes da safra. Marcar como ativa afetará o sistema padrão.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Nome</Label>
                    <Input id="name" value={seasonForm.name || ""} onChange={(e) => setSeasonForm({...seasonForm, name: e.target.value})} className="col-span-3" placeholder="Ex: Safra 2024/2025" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="startDate" className="text-right">Início</Label>
                    <Input id="startDate" type="date" value={seasonForm.startDate || ""} onChange={(e) => setSeasonForm({...seasonForm, startDate: e.target.value})} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="endDate" className="text-right">Fim Previsto</Label>
                    <Input id="endDate" type="date" value={seasonForm.endDate || ""} onChange={(e) => setSeasonForm({...seasonForm, endDate: e.target.value})} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="totalArea" className="text-right">Área Total (ha)</Label>
                    <Input id="totalArea" type="number" step="0.01" value={seasonForm.totalArea || ""} onChange={(e) => setSeasonForm({...seasonForm, totalArea: Number(e.target.value)})} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="plannedCost" className="text-right">Custo Planejado</Label>
                    <Input id="plannedCost" type="number" step="0.01" value={seasonForm.plannedCostInCents || ""} onChange={(e) => setSeasonForm({...seasonForm, plannedCostInCents: Number(e.target.value)})} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="active" className="text-right">Status Ativo</Label>
                    <div className="col-span-3 flex items-center space-x-2">
                      <Switch id="active" checked={!!seasonForm.active} onCheckedChange={(c) => setSeasonForm({...seasonForm, active: c})} />
                      <Label htmlFor="active">{seasonForm.active ? "Sim" : "Não"}</Label>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveSeason} disabled={createSeasonMutation.isPending || updateSeasonMutation.isPending}>Salvar Safra</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingSeasons ? (
              <div className="p-4 space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : seasons?.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                Nenhuma safra cadastrada.
              </div>
            ) : (
              <ul className="divide-y border-t">
                {seasons?.map((season) => (
                  <li key={season.id}>
                    <button
                      onClick={() => setSelectedSeasonId(season.id)}
                      className={`flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-muted/50 ${selectedSeasonId === season.id ? "bg-muted font-medium" : ""}`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span>{season.name}</span>
                          {season.active && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">Ativa</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(season.startDate).toLocaleDateString("pt-BR")} - {new Date(season.endDate).toLocaleDateString("pt-BR")}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEditSeason(season) }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Work Fronts Details */}
        <Card className={!selectedSeasonId ? "opacity-50 pointer-events-none" : ""}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Frentes de Trabalho</CardTitle>
              <CardDescription>
                {selectedSeasonId 
                  ? `Gerenciando frentes da safra selecionada.` 
                  : "Selecione uma safra ao lado."}
              </CardDescription>
            </div>
            {selectedSeasonId && (
              <Dialog open={isFrontModalOpen} onOpenChange={setIsFrontModalOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => setFrontForm({ active: true })}>
                    <Plus className="mr-2 h-4 w-4" /> Nova Frente
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nova Frente de Trabalho</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="front-name" className="text-right">Nome</Label>
                      <Input id="front-name" value={frontForm.name || ""} onChange={(e) => setFrontForm({...frontForm, name: e.target.value})} className="col-span-3" placeholder="Ex: Frente 1 - Plantio" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="front-desc" className="text-right">Descrição</Label>
                      <Textarea id="front-desc" value={frontForm.description || ""} onChange={(e) => setFrontForm({...frontForm, description: e.target.value})} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="front-start" className="text-right">Data Início</Label>
                      <Input id="front-start" type="date" value={frontForm.startDate || ""} onChange={(e) => setFrontForm({...frontForm, startDate: e.target.value})} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="front-active" className="text-right">Ativa</Label>
                      <div className="col-span-3 flex items-center space-x-2">
                        <Switch id="front-active" checked={!!frontForm.active} onCheckedChange={(c) => setFrontForm({...frontForm, active: c})} />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleSaveFront} disabled={createFrontMutation.isPending}>Salvar Frente</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            {!selectedSeasonId ? (
              <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed p-8 text-center text-muted-foreground">
                Selecione uma safra na lista ao lado para gerenciar suas frentes de trabalho.
              </div>
            ) : isLoadingFronts ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : workFronts?.length === 0 ? (
              <Alert>
                <Target className="h-4 w-4" />
                <AlertTitle>Nenhuma Frente Encontrada</AlertTitle>
                <AlertDescription>
                  Esta safra ainda não possui frentes de trabalho cadastradas. Crie a primeira clicando no botão acima.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {workFronts?.map((front) => (
                  <Card key={front.id} className={!front.active ? "opacity-60 bg-muted/50" : ""}>
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold">{front.name}</CardTitle>
                        {front.active ? (
                          <span className="flex h-2 w-2 rounded-full bg-green-500" />
                        ) : (
                          <span className="flex h-2 w-2 rounded-full bg-red-500" />
                        )}
                      </div>
                      <CardDescription className="text-xs line-clamp-1">{front.description || "Sem descrição"}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(front.startDate).toLocaleDateString("pt-BR")}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Vinculações manuais
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
