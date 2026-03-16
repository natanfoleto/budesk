"use client"

import { Save } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useEmployees } from "@/hooks/use-employees"
import { useCreateProduction, usePlantingParameters, usePlantingProductions } from "@/hooks/use-planting"
import { formatCurrency } from "@/lib/utils"
import { PlantingProduction, PlantingProductionFormData } from "@/types/planting"

interface PlantingTabProps {
  seasonId: string
  frontId: string
  date: string
}

type ProductionRecord = {
  id?: string
  employeeId: string
  employeeName: string
  plantingMeters: number
  cuttingMeters: number
  isClosed: boolean
}

export function PlantingTab({ seasonId, frontId, date }: PlantingTabProps) {
  const [productions, setProductions] = useState<Record<string, ProductionRecord>>({})
  const [isEditing, setIsEditing] = useState(false)
  const [globalPlantingPrice, setGlobalPlantingPrice] = useState<string>("")
  const [globalCuttingPrice, setGlobalCuttingPrice] = useState<string>("")
  const [typeFilter, setTypeFilter] = useState<"ALL" | "PLANTIO" | "CORTE">("ALL")

  // Fetch all active employees via shared hook
  const { data: employees, isLoading: isLoadingEmployees } = useEmployees()

  // Fetch parameters to get default prices
  const { data: parameters } = usePlantingParameters()
  const defaultPlantingPrice = Number(parameters?.find(p => p.key === "valor_metro_plantio")?.value || 0)
  const defaultCuttingPrice = Number(parameters?.find(p => p.key === "valor_metro_corte")?.value || 0)

  // Fetch existing productions via shared hook
  const { data: existingRecords, isLoading: isLoadingRecords, refetch } = usePlantingProductions({
    seasonId,
    frontId,
    date: date ? `${date}T00:00:00Z` : undefined
  })

  const createProductionMutation = useCreateProduction()

  // Initialize table state
  useEffect(() => {
    if (employees && existingRecords) {
      const state: Record<string, ProductionRecord> = {}
      
      // Initialize with all employees
      employees.forEach((emp: { id: string; name: string }) => {
        state[emp.id] = {
          employeeId: emp.id,
          employeeName: emp.name,
          plantingMeters: 0,
          cuttingMeters: 0,
          isClosed: false
        }
      })

      // Populate existing values
      existingRecords.forEach((rec: PlantingProduction) => {
        if (state[rec.employeeId]) {
          if (rec.type === "PLANTIO") {
            state[rec.employeeId].plantingMeters = rec.meters || 0
            state[rec.employeeId].id = rec.id 
            state[rec.employeeId].isClosed = rec.isClosed
          } else if (rec.type === "CORTE") {
            state[rec.employeeId].cuttingMeters = rec.meters || 0
            state[rec.employeeId].isClosed = rec.isClosed
          }
        }
      })
      
      setProductions(state)
      setIsEditing(false)
    }
  }, [employees, existingRecords])

  const handleSave = async () => {
    const toSave: PlantingProductionFormData[] = []
    Object.values(productions).forEach(p => {
      // Always use 0 if not provided, backend should handle upsert/delete if needed
      // Actually current implementation only saves if > 0
      if (p.plantingMeters > 0) {
        toSave.push({
          employeeId: p.employeeId,
          frontId: frontId,
          seasonId: seasonId,
          date: new Date(date).toISOString(),
          type: "PLANTIO",
          meters: p.plantingMeters,
          meterValueInCents: globalPlantingPrice ? Math.round(Number(globalPlantingPrice) * 100) : 0
        })
      }
      if (p.cuttingMeters > 0) {
        toSave.push({
          employeeId: p.employeeId,
          frontId: frontId,
          seasonId: seasonId,
          date: new Date(date).toISOString(),
          type: "CORTE",
          meters: p.cuttingMeters,
          meterValueInCents: globalCuttingPrice ? Math.round(Number(globalCuttingPrice) * 100) : 0
        })
      }
    })

    if (toSave.length === 0) {
      toast.info("Nenhum valor preenchido para salvar.")
      return
    }

    try {
      await Promise.all(toSave.map(payload => createProductionMutation.mutateAsync(payload)))
      toast.success("Apontamentos salvos com sucesso!")
      setIsEditing(false)
      setGlobalPlantingPrice("")
      setGlobalCuttingPrice("")
      refetch()
    } catch {
      // Error already handled by toast in hook
    }
  }

  const handleInputChange = (empId: string, field: "plantingMeters"|"cuttingMeters", val: string) => {
    setIsEditing(true)
    const num = Number(val)
    setProductions(prev => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        [field]: isNaN(num) ? 0 : num
      }
    }))
  }

  if (seasonId === "all" || frontId === "all" || !date) {
    return (
      <Card>
        <CardContent className="flex h-40 items-center justify-center text-muted-foreground p-6">
          Selecione a Safra, Frente de Trabalho e Data acima para visualizar e editar os apontamentos.
        </CardContent>
      </Card>
    )
  }

  const sortedEmployees = Object.values(productions).sort((a, b) => a.employeeName.localeCompare(b.employeeName))

  const currentPlantingPrice = globalPlantingPrice ? Number(globalPlantingPrice) * 100 : defaultPlantingPrice
  const currentCuttingPrice = globalCuttingPrice ? Number(globalCuttingPrice) * 100 : defaultCuttingPrice

  const totals = sortedEmployees.reduce(
    (acc, curr) => {
      acc.planting += curr.plantingMeters || 0
      acc.cutting += curr.cuttingMeters || 0
      
      let est = 0
      if (typeFilter === "ALL" || typeFilter === "PLANTIO") {
        est += (curr.plantingMeters || 0) * currentPlantingPrice
      }
      if (typeFilter === "ALL" || typeFilter === "CORTE") {
        est += (curr.cuttingMeters || 0) * currentCuttingPrice
      }
      acc.value += est

      return acc
    },
    { planting: 0, cutting: 0, value: 0 }
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg">Plantio & Corte</CardTitle>
          <CardDescription>
            Informe a metragem de plantio ou corte realizada por cada funcionário nesta frente e data.
          </CardDescription>
        </div>
        <Button onClick={handleSave} disabled={!isEditing || createProductionMutation.isPending}>
          <Save className="h-4 w-4" /> Salvar Alterações
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-6 items-center rounded-md border p-3 bg-muted/20">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Preço Diário: Plantio (R$/m)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="Padrão do sistema"
              className="h-8 max-w-[180px]"
              value={globalPlantingPrice}
              onChange={(e) => { setGlobalPlantingPrice(e.target.value); setIsEditing(true) }}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Preço Diário: Corte (R$/m)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="Padrão do sistema"
              className="h-8 max-w-[180px]"
              value={globalCuttingPrice}
              onChange={(e) => { setGlobalCuttingPrice(e.target.value); setIsEditing(true) }}
            />
          </div>
          <div className="flex-1 text-xs text-muted-foreground p-2 border-l pl-4">
            Se você não preencher estes campos, o sistema usará o valor padrão em Parâmetros Gerais. Este preço será aplicado a todos desta frente no dia {new Date(date).toLocaleDateString("pt-BR", { timeZone: "UTC" })}.
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Label className="text-sm font-medium whitespace-nowrap">Filtrar por:</Label>
            <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecione o filtro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Plantio e Corte</SelectItem>
                <SelectItem value="PLANTIO">Apenas Plantio</SelectItem>
                <SelectItem value="CORTE">Apenas Corte</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Funcionário</TableHead>
                {(typeFilter === "ALL" || typeFilter === "PLANTIO") && (
                  <TableHead className="w-[120px] text-center">Plantio (m)</TableHead>
                )}
                {(typeFilter === "ALL" || typeFilter === "CORTE") && (
                  <TableHead className="w-[120px] text-center">Corte (m)</TableHead>
                )}
                <TableHead className="w-[120px] text-right">Valor (Est.)</TableHead>
                <TableHead className="w-[80px] text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingEmployees || isLoadingRecords ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24 mx-auto" /></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                ))
              ) : sortedEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Nenhum funcionário ativo encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                sortedEmployees.map((record) => {
                  const currentPlantingPrice = globalPlantingPrice ? Number(globalPlantingPrice) * 100 : defaultPlantingPrice
                  const currentCuttingPrice = globalCuttingPrice ? Number(globalCuttingPrice) * 100 : defaultCuttingPrice
                  const estimatedTotalInCents = 
                    ((record.plantingMeters || 0) * currentPlantingPrice) + 
                    ((record.cuttingMeters || 0) * currentCuttingPrice)


                  return (
                    <TableRow key={record.employeeId} className={record.isClosed ? "bg-muted/50" : ""}>
                      <TableCell className="font-medium">{record.employeeName}</TableCell>
                      {(typeFilter === "ALL" || typeFilter === "PLANTIO") && (
                        <TableCell>
                          <Input
                            type="number"
                            className="h-8 text-center"
                            value={record.plantingMeters || ""}
                            onChange={(e) => handleInputChange(record.employeeId, "plantingMeters", e.target.value)}
                            disabled={record.isClosed}
                            placeholder="0"
                          />
                        </TableCell>
                      )}
                      {(typeFilter === "ALL" || typeFilter === "CORTE") && (
                        <TableCell>
                          <Input
                            type="number"
                            className="h-8 text-center"
                            value={record.cuttingMeters || ""}
                            onChange={(e) => handleInputChange(record.employeeId, "cuttingMeters", e.target.value)}
                            disabled={record.isClosed}
                            placeholder="0"
                          />
                        </TableCell>
                      )}
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Math.round(estimatedTotalInCents))}
                      </TableCell>
                      <TableCell className="text-right">
                        {record.isClosed ? (
                          <span className="text-xs text-muted-foreground">Fechado</span>
                        ) : (
                          <span className="text-xs text-green-600">Aberto</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
            <TableHeader>
              <TableRow className="bg-muted/50 font-bold hover:bg-muted/50">
                <TableCell className="text-right">Total</TableCell>
                {(typeFilter === "ALL" || typeFilter === "PLANTIO") && (
                  <TableCell className="text-center">{totals.planting} m</TableCell>
                )}
                {(typeFilter === "ALL" || typeFilter === "CORTE") && (
                  <TableCell className="text-center">{totals.cutting} m</TableCell>
                )}
                <TableCell className="text-right text-emerald-600">
                  {formatCurrency(Math.round(totals.value))}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHeader>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
