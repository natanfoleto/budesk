"use client"

import { Save, Scissors, Sprout } from "lucide-react"
import React, { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useEmployees, useUpdateEmployee } from "@/hooks/use-employees"
import { useCreateProduction, usePlantingParameters, usePlantingProductions } from "@/hooks/use-planting"
import { formatCurrency } from "@/lib/utils"
import { PlantingProduction, PlantingProductionFormData } from "@/types/planting"

interface PlantingTabProps {
  seasonId: string
  frontId: string
  date: string
  employeeNameFilter?: string
  isPeriodClosed: boolean
}

type ProductionRecord = {
  plantingId?: string
  cuttingId?: string
  employeeId: string
  employeeName: string
  plantingMeters: number
  cuttingMeters: number
  isClosed: boolean
  plantingCategory: string
}

export function PlantingTab({ seasonId, frontId, date, employeeNameFilter = "", isPeriodClosed }: PlantingTabProps) {
  const [productions, setProductions] = useState<Record<string, ProductionRecord>>({})
  const [isEditing, setIsEditing] = useState(false)
  const [globalPlantingPrice, setGlobalPlantingPrice] = useState<string>("")
  const [globalCuttingPrice, setGlobalCuttingPrice] = useState<string>("")
  const [typeFilter, setTypeFilter] = useState<"ALL" | "PLANTIO" | "CORTE">("ALL")

  // Fetch all active employees via shared hook
  const { data: employees, isLoading: isLoadingEmployees } = useEmployees()
  const updateEmployeeMutation = useUpdateEmployee()

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
      
      // Initialize with all employees — isClosed driven by period status, not per-record
      employees.forEach((emp: { id: string; name: string; plantingCategory?: string | null }) => {
        state[emp.id] = {
          employeeId: emp.id,
          employeeName: emp.name,
          plantingMeters: 0,
          cuttingMeters: 0,
          isClosed: isPeriodClosed,
          plantingCategory: emp.plantingCategory || ""
        }
      })

      // Populate existing values (do NOT override isClosed — that comes from isPeriodClosed)
      let firstPlantingPrice = 0
      let firstCuttingPrice = 0

      existingRecords.forEach((rec: PlantingProduction) => {
        if (state[rec.employeeId]) {
          if (rec.type === "PLANTIO") {
            state[rec.employeeId].plantingMeters = rec.meters || 0
            state[rec.employeeId].plantingId = rec.id
            if (rec.meterValueInCents > 0 && firstPlantingPrice === 0) {
              firstPlantingPrice = rec.meterValueInCents
            }
          } else if (rec.type === "CORTE") {
            state[rec.employeeId].cuttingMeters = rec.meters || 0
            state[rec.employeeId].cuttingId = rec.id
            if (rec.meterValueInCents > 0 && firstCuttingPrice === 0) {
              firstCuttingPrice = rec.meterValueInCents
            }
          }
        }
      })
      
      setProductions(state)
      setIsEditing(false)

      // Only set from records if the user hasn't typed anything yet or it's a fresh load
      if (firstPlantingPrice > 0) setGlobalPlantingPrice((firstPlantingPrice / 100).toString())
      if (firstCuttingPrice > 0) setGlobalCuttingPrice((firstCuttingPrice / 100).toString())
    }
  }, [employees, existingRecords, isPeriodClosed])

  const handleCategoryChange = (empId: string, category: string) => {
    setIsEditing(true)
    setProductions(prev => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        plantingCategory: category
      }
    }))
  }

  const handleSave = async () => {
    const toSaveProductions: PlantingProductionFormData[] = []
    const toUpdateEmployees: { id: string, category: string }[] = []

    Object.values(productions).forEach(p => {
      // Production records
      if (p.plantingMeters > 0 || p.plantingId) {
        toSaveProductions.push({
          id: p.plantingId,
          employeeId: p.employeeId,
          frontId: frontId,
          seasonId: seasonId,
          date: `${date}T12:00:00.000Z`,
          type: "PLANTIO",
          meters: p.plantingMeters,
          meterValueInCents: globalPlantingPrice ? Math.round(Number(globalPlantingPrice) * 100) : defaultPlantingPrice
        })
      }
      if (p.cuttingMeters > 0 || p.cuttingId) {
        toSaveProductions.push({
          id: p.cuttingId,
          employeeId: p.employeeId,
          frontId: frontId,
          seasonId: seasonId,
          date: `${date}T12:00:00.000Z`,
          type: "CORTE",
          meters: p.cuttingMeters,
          meterValueInCents: globalCuttingPrice ? Math.round(Number(globalCuttingPrice) * 100) : defaultCuttingPrice
        })
      }

      // Category updates (if changed from the original employee data)
      const originalEmp = employees?.find((e: { id: string; plantingCategory?: string | null }) => e.id === p.employeeId)
      const originalCategory = originalEmp?.plantingCategory || ""
      if (p.plantingCategory !== originalCategory) {
        toUpdateEmployees.push({ id: p.employeeId, category: p.plantingCategory })
      }
    })

    if (toSaveProductions.length === 0 && toUpdateEmployees.length === 0) {
      toast.info("Nenhuma alteração para salvar.")
      return
    }

    try {
      // Execute all updates in parallel
      await Promise.all([
        ...toSaveProductions.map(payload => createProductionMutation.mutateAsync(payload)),
        ...toUpdateEmployees.map(emp => updateEmployeeMutation.mutateAsync({
          id: emp.id,
          data: { plantingCategory: emp.category }
        }))
      ])

      toast.dismiss() // Consolidate multiple notifications from hooks
      toast.success("Alterações salvas com sucesso!")
      setIsEditing(false)
      refetch()
    } catch {
      // Error handled by hooks
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

  const sortedEmployees = Object.values(productions)
    .filter((a) => {
      const matchesName =
        employeeNameFilter.trim() === "" ||
        a.employeeName.toLowerCase().includes(employeeNameFilter.toLowerCase())

      const matchesType =
        typeFilter === "ALL" ||
        a.plantingCategory === typeFilter

      return matchesName && matchesType
    })
    .sort((a, b) => {
      // Sort by category: PLANTIO > CORTE > others
      const catA = a.plantingCategory || "ZZ"
      const catB = b.plantingCategory || "ZZ"

      if (catA !== catB) {
        if (catA === "PLANTIO") return -1
        if (catB === "PLANTIO") return 1
        if (catA === "CORTE") return -1
        if (catB === "CORTE") return 1
        return catA.localeCompare(catB)
      }

      // Then by name
      return a.employeeName.localeCompare(b.employeeName)
    })

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
              placeholder={`${(defaultPlantingPrice / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`}
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
              placeholder={`${(defaultCuttingPrice / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`}
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
            <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val as typeof typeFilter)}>
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
                <TableHead className="w-[100px] text-center">Tipo</TableHead>
                {(typeFilter === "ALL" || typeFilter === "PLANTIO") && (
                  <TableHead className="w-[120px] text-center">Plantio (m)</TableHead>
                )}
                {(typeFilter === "ALL" || typeFilter === "CORTE") && (
                  <TableHead className="w-[120px] text-center">Corte (m)</TableHead>
                )}
                <TableHead className="w-[120px] text-right">Valor (Est.)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingEmployees || isLoadingRecords ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell className="flex justify-center py-2"><Skeleton className="h-8 w-16" /></TableCell>
                    {(typeFilter === "ALL" || typeFilter === "PLANTIO") && (
                      <TableCell><Skeleton className="h-8 w-24 mx-auto" /></TableCell>
                    )}
                    {(typeFilter === "ALL" || typeFilter === "CORTE") && (
                      <TableCell><Skeleton className="h-8 w-24 mx-auto" /></TableCell>
                    )}
                    <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : sortedEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Nenhum funcionário ativo encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                sortedEmployees.map((record, index) => {
                  const currentPlantingPrice = globalPlantingPrice ? Number(globalPlantingPrice) * 100 : defaultPlantingPrice
                  const currentCuttingPrice = globalCuttingPrice ? Number(globalCuttingPrice) * 100 : defaultCuttingPrice
                  const estimatedTotalInCents = 
                    ((record.plantingMeters || 0) * currentPlantingPrice) + 
                    ((record.cuttingMeters || 0) * currentCuttingPrice)

                  // Add separator between groups
                  const showSeparator = index > 0 && 
                    sortedEmployees[index - 1].plantingCategory === "PLANTIO" && 
                    record.plantingCategory === "CORTE"

                  return (
                    <React.Fragment key={record.employeeId}>
                      {showSeparator && (
                        <TableRow className="hover:bg-transparent h-2">
                          <TableCell colSpan={6} className="p-0 bg-muted">
                          </TableCell>
                        </TableRow>
                      )}
                      <TableRow className={record.isClosed ? "bg-muted/50" : ""}>
                        <TableCell className="font-medium">{record.employeeName}</TableCell>
                        <TableCell className="flex justify-center py-2">
                          <ToggleGroup 
                            type="single" 
                            size="sm"
                            value={record.plantingCategory || "NONE"} 
                            onValueChange={(val) => {
                              if (val) handleCategoryChange(record.employeeId, val === "NONE" ? "" : val)
                            }}
                          >
                            <ToggleGroupItem value="PLANTIO" aria-label="Plantio" className="data-[state=on]:bg-emerald-100 data-[state=on]:text-emerald-900 border border-transparent data-[state=on]:border-emerald-200">
                              <Sprout className="h-3.5 w-3.5" />
                            </ToggleGroupItem>
                            <ToggleGroupItem value="CORTE" aria-label="Corte" className="data-[state=on]:bg-amber-100 data-[state=on]:text-amber-900 border border-transparent data-[state=on]:border-amber-200">
                              <Scissors className="h-3.5 w-3.5" />
                            </ToggleGroupItem>
                          </ToggleGroup>
                        </TableCell>
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
                      </TableRow>
                    </React.Fragment>
                  )
                })
              )}
            </TableBody>
            <TableHeader>
              <TableRow className="bg-muted/50 font-bold hover:bg-muted/50">
                <TableCell className="text-right">Total</TableCell>
                <TableCell></TableCell>
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
        <div className="flex justify-end mt-4">
          <Button onClick={handleSave} disabled={!isEditing || createProductionMutation.isPending}>
            <Save className="h-4 w-4" /> Salvar Alterações
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
