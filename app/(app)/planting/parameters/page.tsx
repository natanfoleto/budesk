"use client"

import { Save, Settings2 } from "lucide-react"
import { useEffect,useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription,CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { usePlantingParameters, useSaveParameters } from "@/hooks/use-planting"
import { formatCentsToReal } from "@/lib/utils"

const DEFAULT_PARAMETER_KEYS = [
  { key: "valor_metro_plantio", label: "Valor Plantio por Metro Linear", desc: "Pago ao funcionário por metro plantado", isCurrency: true },
  { key: "valor_metro_corte", label: "Valor Corte por Metro Linear", desc: "Pago ao funcionário por metro cortado", isCurrency: true },
  { key: "preco_diesel", label: "Preço do Diesel", desc: "Custo base usado na frota", isCurrency: true },
  { key: "valor_refeicao", label: "Valor da Refeição (Marmitex)", desc: "Custo base diário por refeição", isCurrency: true },
  { key: "area_hectare_plantio", label: "Área Hectare Plantio", desc: "Metros lineares correspondentes a um hectare de plantio", isCurrency: false, default: 834 },
  { key: "area_hectare_corte", label: "Área Hectare Corte", desc: "Metros lineares correspondentes a um hectare de corte", isCurrency: false, default: 1333 },
]

export default function PlantingParametersPage() {
  const [paramsForm, setParamsForm] = useState<Record<string, number>>({})

  const { data: parameters, isLoading } = usePlantingParameters()
  const saveParametersMutation = useSaveParameters()

  // Initialize form with fetched data
  useEffect(() => {
    if (parameters) {
      const initialForm: Record<string, number> = {}
      DEFAULT_PARAMETER_KEYS.forEach(k => {
        initialForm[k.key] = k.default || 0
      })
      parameters.forEach((p) => {
        initialForm[p.key] = Number(p.value) || initialForm[p.key] || 0
      })
      setParamsForm(initialForm)
    }
  }, [parameters])

  const handleSave = () => {
    const payload = {
      parameters: Object.entries(paramsForm).map(([key, val]) => ({
        key,
        value: String(val),
      })),
    }
    // @ts-expect-error Types might have diverged, but payload format matches handler
    saveParametersMutation.mutate(payload)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Parâmetros Gerais</h2>
          <p className="text-muted-foreground">
            Configure os valores base que serão utilizados nos cálculos automáticos de apontamentos e produtividade.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saveParametersMutation.isPending || isLoading}>
          <Save className="h-4 w-4" />
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
              {DEFAULT_PARAMETER_KEYS.map((item) => (
                <div key={item.key} className="grid md:grid-cols-2 gap-4 items-center border-b pb-4 last:border-0 last:pb-0">
                  <div>
                    <Label htmlFor={item.key} className="text-base">{item.label}</Label>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">{item.key}</p>
                  </div>
                  <div className="relative">
                    <Input
                      id={item.key}
                      placeholder={item.isCurrency ? "R$ 0,00" : "0"}
                      value={item.isCurrency ? formatCentsToReal(paramsForm[item.key] || 0) : (paramsForm[item.key] || "")}
                      onChange={(e) => {
                        if (item.isCurrency) {
                          const value = e.target.value.replace(/\D/g, "")
                          setParamsForm({ ...paramsForm, [item.key]: Number(value) })
                        } else {
                          const value = e.target.value.replace(/[^0-9.]/g, "")
                          setParamsForm({ ...paramsForm, [item.key]: Number(value) })
                        }
                      }}
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
