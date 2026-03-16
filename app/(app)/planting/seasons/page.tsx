"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Calendar, Edit, Loader2,Plus, Target, Trash, Users } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  useCreateSeason,
  useCreateWorkFront,
  useDeleteSeason,
  usePlantingSeasons,
  useUpdateSeason,
  useWorkFronts,
} from "@/hooks/use-planting"

const seasonSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nome é obrigatório"),
  startDate: z.string().min(1, "Data de início é obrigatória"),
  endDate: z.string().optional().or(z.literal("")),
  totalArea: z.preprocess((val) => (val === "" || val == null ? undefined : Number(val)), z.number().min(0).optional()),
  notes: z.string().optional().or(z.literal("")),
  active: z.boolean().default(true),
})

type SeasonFormValues = z.infer<typeof seasonSchema>

const frontSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional().or(z.literal("")),
  active: z.boolean().default(true),
})

type FrontFormValues = z.infer<typeof frontSchema>

export default function PlantingSeasonsPage() {
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null)

  const [isSeasonModalOpen, setIsSeasonModalOpen] = useState(false)
  const [isFrontModalOpen, setIsFrontModalOpen] = useState(false)
  const [seasonToDelete, setSeasonToDelete] = useState<{ id: string; name: string } | null>(null)

  // Forms setups
  const seasonForm = useForm<SeasonFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(seasonSchema) as any,
    defaultValues: { name: "", startDate: "", endDate: "", notes: "", totalArea: undefined, active: true },
  })

  const frontForm = useForm<FrontFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(frontSchema) as any,
    defaultValues: { name: "", description: "", active: true },
  })

  // Queries
  const { data: seasons, isLoading: isLoadingSeasons } = usePlantingSeasons()
  const { data: workFronts, isLoading: isLoadingFronts } = useWorkFronts(selectedSeasonId ?? undefined)

  // Mutations
  const createSeasonMutation = useCreateSeason()
  const updateSeasonMutation = useUpdateSeason()
  const deleteSeasonMutation = useDeleteSeason()
  const createFrontMutation = useCreateWorkFront()

  const onSaveSeason = (values: SeasonFormValues) => {
    const payload = {
      name: values.name,
      startDate: new Date(values.startDate).toISOString(),
      endDate: values.endDate ? new Date(values.endDate).toISOString() : undefined,
      totalArea: values.totalArea,
      notes: values.notes,
      active: values.active,
    }

    if (values.id) {
      updateSeasonMutation.mutate(
        { id: values.id, data: payload },
        { onSuccess: () => { setIsSeasonModalOpen(false); seasonForm.reset() } }
      )
    } else {
      createSeasonMutation.mutate(payload, {
        onSuccess: () => { setIsSeasonModalOpen(false); seasonForm.reset() }
      })
    }
  }

  const onSaveFront = (values: FrontFormValues) => {
    if (!selectedSeasonId) return
    createFrontMutation.mutate(
      {
        name: values.name,
        description: values.description || undefined,
        active: values.active,
        seasonId: selectedSeasonId,
      },
      { onSuccess: () => { setIsFrontModalOpen(false); frontForm.reset() } }
    )
  }

  const openEditSeason = (season: { id: string; name: string; startDate: string; endDate: string | null; active: boolean; totalArea: number | null; notes: string | null }) => {
    seasonForm.reset({
      id: season.id,
      name: season.name,
      startDate: season.startDate ? new Date(season.startDate).toISOString().split("T")[0] : "",
      endDate: season.endDate ? new Date(season.endDate).toISOString().split("T")[0] : "",
      totalArea: season.totalArea ?? undefined,
      notes: season.notes ?? "",
      active: season.active,
    })
    setIsSeasonModalOpen(true)
  }

  const confirmDeleteSeason = () => {
    if (!seasonToDelete) return
    deleteSeasonMutation.mutate(seasonToDelete.id, {
      onSuccess: () => {
        setSeasonToDelete(null)
        if (selectedSeasonId === seasonToDelete.id) {
          setSelectedSeasonId(null)
        }
      },
    })
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

      <AlertDialog open={!!seasonToDelete} onOpenChange={(open) => !open && setSeasonToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar Safra</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja apagar a safra <strong>{seasonToDelete?.name}</strong>? Esta ação não pode ser desfeita e removerá todos os dados associados a ela (frentes de trabalho, apontamentos, gastos, etc).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSeasonMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                confirmDeleteSeason()
              }}
              disabled={deleteSeasonMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteSeasonMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash className="h-4 w-4" />}
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Safras cadastradas</CardTitle>
              <CardDescription>Selecione uma safra para ver os detalhes</CardDescription>
            </div>
            <Dialog open={isSeasonModalOpen} onOpenChange={setIsSeasonModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => seasonForm.reset({ name: "", startDate: "", endDate: "", notes: "", active: true })}>
                  <Plus className="h-4 w-4" /> Nova
                </Button>
              </DialogTrigger>
              <DialogContent>
                <Form {...seasonForm}>
                  <form onSubmit={seasonForm.handleSubmit(onSaveSeason)}>
                    <DialogHeader>
                      <DialogTitle>{seasonForm.watch("id") ? "Editar Safra" : "Nova Safra"}</DialogTitle>
                      <DialogDescription>
                        Digite os detalhes da safra. Marcar como ativa afetará o sistema padrão.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <FormField control={seasonForm.control} name="name" render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                          <FormLabel className="text-right">Nome</FormLabel>
                          <div className="col-span-3">
                            <FormControl>
                              <Input placeholder="Ex: Safra 2024/2025" {...field} />
                            </FormControl>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )} />
                      <FormField control={seasonForm.control} name="startDate" render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                          <FormLabel className="text-right">Início</FormLabel>
                          <div className="col-span-3">
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )} />
                      <FormField control={seasonForm.control} name="endDate" render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                          <FormLabel className="text-right">Fim Previsto</FormLabel>
                          <div className="col-span-3">
                            <FormControl>
                              <Input type="date" {...field} value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )} />
                      <FormField control={seasonForm.control} name="totalArea" render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                          <FormLabel className="text-right">Área Total (ha)</FormLabel>
                          <div className="col-span-3">
                            <FormControl>
                              <Input type="number" step="0.01" {...field} value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )} />
                      <FormField control={seasonForm.control} name="notes" render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                          <FormLabel className="text-right">Obs.</FormLabel>
                          <div className="col-span-3">
                            <FormControl>
                              <Textarea {...field} value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )} />
                      <FormField control={seasonForm.control} name="active" render={({ field }) => (
                        <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                          <FormLabel className="text-right">Status Ativo</FormLabel>
                          <div className="col-span-3 flex items-center space-x-2">
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <Label>{field.value ? "Sim" : "Não"}</Label>
                          </div>
                        </FormItem>
                      )} />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={createSeasonMutation.isPending || updateSeasonMutation.isPending}>
                        Salvar Safra
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
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
                    <div
                      onClick={() => setSelectedSeasonId(season.id)}
                      className={`cursor-pointer flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-muted/50 ${selectedSeasonId === season.id ? "bg-muted font-medium" : ""}`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span>{season.name}</span>
                          {season.active && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">Ativa</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(season.startDate).toLocaleDateString("pt-BR")}
                          {season.endDate ? ` - ${new Date(season.endDate).toLocaleDateString("pt-BR")}` : " — Em andamento"}
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEditSeason(season) }}>
                          <Edit className="size-3.5" />
                        </Button>
                        
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={(e) => { e.stopPropagation(); setSeasonToDelete({ id: season.id, name: season.name }) }}>
                          <Trash className="size-3.5" />
                        </Button>
                      </div>
                    </div>
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
                  <Button size="sm" onClick={() => frontForm.reset({ name: "", description: "", active: true })}>
                    <Plus className="h-4 w-4" /> Nova Frente
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <Form {...frontForm}>
                    <form onSubmit={frontForm.handleSubmit(onSaveFront)}>
                      <DialogHeader>
                        <DialogTitle>Nova Frente de Trabalho</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <FormField control={frontForm.control} name="name" render={({ field }) => (
                          <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                            <FormLabel className="text-right">Nome</FormLabel>
                            <div className="col-span-3">
                              <FormControl>
                                <Input placeholder="Ex: Frente 1 - Plantio" {...field} />
                              </FormControl>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )} />
                        <FormField control={frontForm.control} name="description" render={({ field }) => (
                          <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                            <FormLabel className="text-right">Descrição</FormLabel>
                            <div className="col-span-3">
                              <FormControl>
                                <Textarea {...field} value={field.value ?? ""} />
                              </FormControl>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )} />
                        <FormField control={frontForm.control} name="active" render={({ field }) => (
                          <FormItem className="grid grid-cols-4 items-center gap-4 space-y-0">
                            <FormLabel className="text-right">Ativa</FormLabel>
                            <div className="col-span-3 flex items-center space-x-2">
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </div>
                          </FormItem>
                        )} />
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={createFrontMutation.isPending}>Salvar Frente</Button>
                      </DialogFooter>
                    </form>
                  </Form>
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
                          {new Date(front.createdAt).toLocaleDateString("pt-BR")}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {front.active ? "Ativa" : "Inativa"}
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
