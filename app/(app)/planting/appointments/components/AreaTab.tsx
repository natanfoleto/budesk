"use client"

import { AlertCircle, Save } from "lucide-react"
import { useEffect, useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useCreatePlantingArea, usePlantingAreas } from "@/hooks/use-planting"
import { PlantingAreaFormData } from "@/types/planting"

interface AreaTabProps {
  seasonId: string
  frontId: string
  date: string
}

export function AreaTab({ seasonId, frontId, date }: AreaTabProps) {
  const [hectares, setHectares] = useState<number>(0)
  const [isClosed, setIsClosed] = useState(false)

  // Fetch existing area record via shared hook
  const { data: areaRecords, isLoading, refetch } = usePlantingAreas({
    seasonId,
    frontId,
    date: date ? `${date}T00:00:00Z` : undefined
  })

  const saveMutation = useCreatePlantingArea()

  useEffect(() => {
    if (areaRecords && areaRecords.length > 0) {
      setHectares(areaRecords[0].hectares)
      setIsClosed(areaRecords[0].isClosed)
    } else {
      setHectares(0)
      setIsClosed(false)
    }
  }, [areaRecords])

  const handleSave = () => {
    const payload: PlantingAreaFormData = {
      seasonId,
      frontId,
      date: new Date(date).toISOString(),
      hectares: hectares,
      workedArea: hectares // In manual planting, usually hectares = workedArea
    }
    
    saveMutation.mutate(payload, {
      onSuccess: () => {
        refetch()
      }
    })
  }

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
    <Card>
      <CardHeader>
        <CardTitle>Controle de Área (Hectares)</CardTitle>
        <CardDescription>
          Informe a quantidade de hectares (ha) concluídos nesta frente na data selecionada.
          Este valor é vital para o cálculo de custo/ha e produtividade geral.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="space-y-2">
                <Label htmlFor="hectares" className="text-base">Hectares concluídos (ha)</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    id="hectares"
                    type="number" 
                    step="0.01"
                    className="w-32 text-lg font-bold"
                    value={hectares || ""}
                    onChange={(e) => setHectares(Number(e.target.value))}
                    disabled={isClosed}
                  />
                  <Button onClick={handleSave} disabled={saveMutation.isPending || isClosed}>
                    <Save className="mr-2 h-4 w-4" /> 
                    Salvar
                  </Button>
                </div>
              </div>
            </div>

            {isClosed && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Período Fechado</AlertTitle>
                <AlertDescription>
                  A alteração deste valor está bloqueada pois pertence a um período de safra que já foi fechado.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
