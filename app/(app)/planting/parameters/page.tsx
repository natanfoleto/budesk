"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Save, Settings2 } from "lucide-react"
import { useEffect,useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription,CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

export default function PlantingParametersPage() {
  const queryClient = useQueryClient()
  const [paramsForm, setParamsForm] = useState<Record<string, string>>({})

  // Fetch Parameters
  const { data: parameters, isLoading } = useQuery({
    queryKey: ["plantingParameters"],
    queryFn: async () => {
      const res = await fetch("/api/planting/parameters")
      if (!res.ok) throw new Error("Failed to fetch parameters")
      const data = await res.json()
      return data
    }
  })

  // Initialize form with fetched data
  useEffect(() => {
    if (parameters) {
      const initialForm: Record<string, string> = {}
      parameters.forEach((p: { key: string; valueInCents: number }) => {
        // Convert from cents to decimal for input display
        initialForm[p.key] = (p.valueInCents / 100).toFixed(2)
      })
      setParamsForm(initialForm)
    }
  }, [parameters])

  // Mutation
  const saveParametersMutation = useMutation({
    mutationFn: async (payload: { parameters: { key: string, valueInCents: number, description?: string }[] }) => {
      const res = await fetch("/api/planting/parameters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error("Failed to save parameters")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plantingParameters"] })
      toast.success("Parâmetros atualizados com sucesso")
    },
    onError: () => {
      toast.error("Erro ao salvar parâmetros")
    }
  })

  const handleSave = () => {
    // Convert back array structure
    const payload = {
      parameters: Object.entries(paramsForm).map(([key, val]) => ({
        key,
        valueInCents: Math.round(Number(val) * 100)
      }))
    }
    saveParametersMutation.mutate(payload)
  }

  const defaultKeys = [
    { key: "valor_metro_plantio", label: "Valor Plantio por Metro Line", desc: "Pago ao funcionário por metro plantado" },
    { key: "valor_metro_corte", label: "Valor Corte por Metro Linear", desc: "Pago ao funcionário por metro cortado" },
    { key: "preco_diesel", label: "Preço do Diesel", desc: "Custo base usado na frota" },
    { key: "valor_refeicao", label: "Valor da Refeição (Marmitex)", desc: "Custo base diário por refeição" },
  ]

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Parâmetros Gerais (Vars)</h2>
          <p className="text-muted-foreground">
            Configure os valores base que serão utilizados nos cálculos automáticos de apontamentos e produtividade.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saveParametersMutation.isPending || isLoading}>
          <Save className="mr-2 h-4 w-4" /> 
          {saveParametersMutation.isPending ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Valores Base</CardTitle>
          </div>
          <CardDescription>
            Esses valores impactarão os novos registros. Alterações aqui não modificam os apontamentos já encerrados ou processados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="grid grid-cols-4 items-center gap-4">
                  <Skeleton className="h-4 w-full col-span-2" />
                  <Skeleton className="h-10 w-full col-span-2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-6">
              {defaultKeys.map((item) => (
                <div key={item.key} className="grid md:grid-cols-2 gap-4 items-center border-b pb-4 last:border-0 last:pb-0">
                  <div>
                    <Label htmlFor={item.key} className="text-base">{item.label}</Label>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">{item.key}</p>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">R$</span>
                    <Input
                      id={item.key}
                      type="number"
                      step="0.01"
                      className="pl-8"
                      value={paramsForm[item.key] ?? ""}
                      onChange={(e) => setParamsForm({ ...paramsForm, [item.key]: e.target.value })}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
