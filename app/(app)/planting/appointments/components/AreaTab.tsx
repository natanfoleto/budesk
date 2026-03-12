"use client"

import { useMutation, useQuery } from "@tanstack/react-query"
import { AlertCircle,Save } from "lucide-react"
import { useEffect,useState } from "react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription,CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

interface AreaTabProps {
  seasonId: string
  frontId: string
  date: string
}

export function AreaTab({ seasonId, frontId, date }: AreaTabProps) {
  const [hectares, setHectares] = useState<number>(0)
  const [areaRecordId, setAreaRecordId] = useState<string | null>(null)
  const [isClosed, setIsClosed] = useState(false)

  // Fetch existing area record for the front/date
  const { data: areaRecords, isLoading, refetch } = useQuery({
    queryKey: ["plantingAreas", seasonId, frontId, date],
    queryFn: async () => {
      if (seasonId === "all" || frontId === "all" || !date) return []
      const res = await fetch(`/api/planting/areas?seasonId=${seasonId}&frontId=${frontId}&date=${date}T00:00:00Z`)
      if (!res.ok) throw new Error("Failed to fetch area data")
      return res.json()
    },
    enabled: seasonId !== "all" && frontId !== "all" && !!date
  })

  useEffect(() => {
    if (areaRecords && areaRecords.length > 0) {
      setHectares(areaRecords[0].workedHectares)
      setAreaRecordId(areaRecords[0].id)
      setIsClosed(areaRecords[0].isClosed)
    } else {
      setHectares(0)
      setAreaRecordId(null)
      setIsClosed(false)
    }
  }, [areaRecords])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        id: areaRecordId || undefined,
        frontId,
        date: new Date(date).toISOString(),
        workedHectares: hectares
      }
      
      const res = await fetch("/api/planting/areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error("Falha ao salvar área")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Área (hectares) atualizada com sucesso!")
      refetch()
    },
    onError: (err) => {
      toast.error(err.message)
    }
  })

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
                  <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || isClosed}>
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
