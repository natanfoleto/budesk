"use client"

import { CircleSlash, Save, Scissors, Search, Sprout } from "lucide-react"
import React, { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { SmartNumberInput } from "@/components/ui/smart-number-input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useEmployees, useUpdateEmployee } from "@/hooks/use-employees"
import { useCreateProduction, useDailyWages, usePlantingParameters, usePlantingProductions } from "@/hooks/use-planting"
import { cn, formatCurrency } from "@/lib/utils"
import { isEmployeeActiveAtDate, shouldShowEmployeeInMonth } from "@/lib/utils/planting-utils"
import { EmployeeWithDetails } from "@/types/employee"
import { DailyWage, PlantingProduction, PlantingProductionFormData } from "@/types/planting"

interface PlantingTabProps {
  seasonId: string
  frontId: string
  date: string
  employeeNameFilter?: string
  onEmployeeFilterChange?: (name: string) => void
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
  isTerminated: boolean
  terminationDate?: string | Date | null
}

const ABSENCE_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  FALTA: { bg: "bg-red-50/50 hover:bg-red-50", text: "text-red-600", label: "FALTA" },
  FALTA_JUSTIFICADA: { bg: "bg-orange-50/50 hover:bg-orange-50", text: "text-orange-600", label: "FALTA JUST." },
  ATESTADO: { bg: "bg-blue-50/50 hover:bg-blue-50", text: "text-blue-600", label: "ATESTADO" },
  FOLGA: { bg: "bg-slate-50/50 hover:bg-slate-50", text: "text-slate-600", label: "FOLGA" }
}

export function PlantingTab({ seasonId, frontId, date, employeeNameFilter = "", onEmployeeFilterChange, isPeriodClosed }: PlantingTabProps) {
  const [productions, setProductions] = useState<Record<string, ProductionRecord>>({})
  const [isEditing, setIsEditing] = useState(false)
  const [globalPlantingPrice, setGlobalPlantingPrice] = useState<string>("")
  const [globalCuttingPrice, setGlobalCuttingPrice] = useState<string>("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [focusedEmployeeId, setFocusedEmployeeId] = useState<string | null>(null)
  const saveButtonRef = useRef<HTMLButtonElement>(null)

  // Fetch all active employees via shared hook
  const { data: employees, isLoading: isLoadingEmployees } = useEmployees()
  const updateEmployeeMutation = useUpdateEmployee({ silent: true })

  // Fetch parameters to get default prices
  const { data: parameters } = usePlantingParameters()
  const defaultPlantingPrice = Number(parameters?.find(p => p.key === "valor_metro_plantio")?.value || 0)
  const defaultCuttingPrice = Number(parameters?.find(p => p.key === "valor_metro_corte")?.value || 0)
  const areaHectareCorte = Number(parameters?.find(p => p.key === "area_hectare_corte")?.value || 1333)
  const areaHectarePlantio = Number(parameters?.find(p => p.key === "area_hectare_plantio")?.value || 834)

  // Fetch existing productions via shared hook
  const { data: existingRecords, isLoading: isLoadingRecords, refetch } = usePlantingProductions({
    seasonId,
    frontId,
    date: date ? `${date}T00:00:00Z` : undefined
  })

  // Fetch existing daily wages (for presence status) via shared hook
  const { data: dailyWages } = useDailyWages({
    seasonId,
    frontId,
    date: date ? `${date}T00:00:00Z` : undefined
  })

  const createProductionMutation = useCreateProduction()

  // Initialize table state
  const [lastContext, setLastContext] = useState("")

  useEffect(() => {
    const currentContext = `${seasonId}-${frontId}-${date}`
    const isNewContext = currentContext !== lastContext

    if (employees && existingRecords) {
      if (isNewContext || !isEditing || Object.keys(productions).length === 0) {
        const state: Record<string, ProductionRecord> = {}
        
        // Filter employees based on termination date
        const employeeList = (employees.data || []) as EmployeeWithDetails[]
        const filteredEmployees = employeeList.filter(emp => shouldShowEmployeeInMonth(date, emp.terminationDate))

        filteredEmployees.forEach((emp) => {
          state[emp.id] = {
            employeeId: emp.id,
            employeeName: emp.name,
            plantingMeters: 0,
            cuttingMeters: 0,
            isClosed: isPeriodClosed,
            plantingCategory: emp.plantingCategory || "",
            isTerminated: !isEmployeeActiveAtDate(date, emp.terminationDate),
            terminationDate: emp.terminationDate
          }
        })

        let firstPlantingPrice = 0
        let firstCuttingPrice = 0

        existingRecords.forEach((rec: PlantingProduction) => {
          if (state[rec.employeeId]) {
            if (rec.type === "PLANTIO") {
              state[rec.employeeId].plantingMeters = Number(rec.meters || 0)
              state[rec.employeeId].plantingId = rec.id
              if (rec.meterValueInCents > 0 && firstPlantingPrice === 0) {
                firstPlantingPrice = rec.meterValueInCents
              }
            } else if (rec.type === "CORTE") {
              state[rec.employeeId].cuttingMeters = Number(rec.meters || 0)
              state[rec.employeeId].cuttingId = rec.id
              if (rec.meterValueInCents > 0 && firstCuttingPrice === 0) {
                firstCuttingPrice = rec.meterValueInCents
              }
            }
          }
        })
        
        setProductions(state)
        setLastContext(currentContext)
        
        // When changing context or loading for the first time, sync the global prices
        if (isNewContext || Object.keys(productions).length === 0) {
          setIsEditing(false)
          setGlobalPlantingPrice(firstPlantingPrice > 0 ? (firstPlantingPrice / 100).toString() : "")
          setGlobalCuttingPrice(firstCuttingPrice > 0 ? (firstCuttingPrice / 100).toString() : "")
        }
      }
    }
  }, [employees, existingRecords, isPeriodClosed, seasonId, frontId, date])

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
      const employeeList = (employees?.data || []) as EmployeeWithDetails[]
      const originalEmp = employeeList.find((e) => e.id === p.employeeId)
      const originalCategory = originalEmp?.plantingCategory || ""
      if (p.plantingCategory !== originalCategory) {
        toUpdateEmployees.push({ id: p.employeeId, category: p.plantingCategory })
      }
    })

    if (toSaveProductions.length === 0 && toUpdateEmployees.length === 0) {
      toast.info("Nenhuma alteração para salvar.")
      return
    }

    // Validation: Check if any employee has production but is marked as absent in Presence
    for (const p of toSaveProductions) {
      if (p.meters && p.meters > 0) {
        const wageRecord = dailyWages?.find((w: DailyWage) => w.employeeId === p.employeeId)
        const presence = wageRecord?.presence || "PRESENCA"
        
        if (presence !== "PRESENCA") {
          const employeeList = (employees?.data || []) as EmployeeWithDetails[]
          const empName = employeeList.find(e => e.id === p.employeeId)?.name || "Funcionário"
          const statusLabel = presence === "FOLGA" ? "Folga" : "Falta/Atestado"
          toast.error(`O funcionário ${empName} não pode registrar produção pois está marcado como ${statusLabel} neste dia.`)
          return
        }
      }
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

      toast.success("Apontamentos salvos com sucesso!")
      setIsEditing(false)
      refetch()
    } catch {
      // Error handled by hooks
    }
  }

  const handleInputChange = (empId: string, field: "plantingMeters"|"cuttingMeters", val: number) => {
    setIsEditing(true)
    setProductions(prev => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        [field]: val
      }
    }))
  }

  const handleKeyDown = (e: React.KeyboardEvent, employeeId: string, field: "plantingMeters"|"cuttingMeters") => {
    if (e.key === "Enter") {
      e.preventDefault()
      const isPlantioVisible = selectedCategories.length === 0 || selectedCategories.includes("PLANTIO")
      const isCorteVisible = selectedCategories.length === 0 || selectedCategories.includes("CORTE")
      const isLastEmployee = sortedEmployees[sortedEmployees.length - 1]?.employeeId === employeeId
      
      const isLastVisibleField = 
        (field === "cuttingMeters" && isCorteVisible) || 
        (field === "plantingMeters" && isPlantioVisible && !isCorteVisible)

      if (isLastEmployee && isLastVisibleField) {
        saveButtonRef.current?.focus()
      } else {
        const table = e.currentTarget.closest('table')
        if (table) {
          const inputs = Array.from(table.querySelectorAll('input:not([disabled])')) as HTMLInputElement[]
          const index = inputs.indexOf(e.currentTarget as HTMLInputElement)
          if (index > -1 && index < inputs.length - 1) {
            inputs[index + 1].focus()
            inputs[index + 1].select()
          }
        }
      }
    }
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

      const matchesType = selectedCategories.length === 0 || selectedCategories.includes(a.plantingCategory || "")
      
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

  const totalPlanting = sortedEmployees.reduce((sum, p) => sum + Number(p.plantingMeters || 0), 0)
  const totalCutting = sortedEmployees.reduce((sum, p) => sum + Number(p.cuttingMeters || 0), 0)
  const totalValue = sortedEmployees.reduce((sum, curr) => {
    const showPlanting = selectedCategories.length === 0 || selectedCategories.includes("PLANTIO")
    const showCutting = selectedCategories.length === 0 || selectedCategories.includes("CORTE")
    
    let est = 0
    if (showPlanting) {
      est += Number(curr.plantingMeters || 0) * currentPlantingPrice
    }
    if (showCutting) {
      est += Number(curr.cuttingMeters || 0) * currentCuttingPrice
    }
    return sum + est
  }, 0)

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
            <ToggleGroup 
              type="multiple" 
              size="sm" 
              value={selectedCategories}
              onValueChange={(val) => setSelectedCategories(val)}
              className="flex gap-1"
            >
              <ToggleGroupItem value="PLANTIO" aria-label="Plantio" className="h-8 w-8 p-0 data-[state=on]:bg-emerald-100 data-[state=on]:text-emerald-900">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Sprout className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>Plantio</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </ToggleGroupItem>
              <ToggleGroupItem value="CORTE" aria-label="Corte" className="h-8 w-8 p-0 data-[state=on]:bg-amber-100 data-[state=on]:text-amber-900">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Scissors className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>Corte</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </ToggleGroupItem>
              <ToggleGroupItem value="" aria-label="Sem tipo" className="h-8 w-8 p-0 data-[state=on]:bg-slate-100 data-[state=on]:text-slate-900">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CircleSlash className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>Sem tipo</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Funcionário</TableHead>
                <TableHead className="w-[60px] px-2 text-center"></TableHead>
                <TableHead className="w-[100px] text-center">Tipo</TableHead>
                {(selectedCategories.length === 0 || selectedCategories.includes("PLANTIO")) && (
                  <TableHead className="w-[120px] text-center">Plantio (m)</TableHead>
                )}
                {(selectedCategories.length === 0 || selectedCategories.includes("CORTE")) && (
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
                    <TableCell className="px-2"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                    <TableCell className="flex justify-center py-2"><Skeleton className="h-8 w-16" /></TableCell>
                    {(selectedCategories.length === 0 || selectedCategories.includes("PLANTIO")) && (
                      <TableCell><Skeleton className="h-8 w-24 mx-auto" /></TableCell>
                    )}
                    {(selectedCategories.length === 0 || selectedCategories.includes("CORTE")) && (
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
                  const prevRecord = index > 0 ? sortedEmployees[index - 1] : null
                  const showSeparator = prevRecord && (
                    (prevRecord.plantingCategory === "PLANTIO" && record.plantingCategory === "CORTE") ||
                    (prevRecord.plantingCategory === "PLANTIO" && !record.plantingCategory) ||
                    (prevRecord.plantingCategory === "CORTE" && !record.plantingCategory)
                  )

                  const dailyWage = dailyWages?.find((dw: DailyWage) => dw.employeeId === record.employeeId)
                  const isAbsent = dailyWage && dailyWage.presence !== "PRESENCA"
                  const presenceType = dailyWage?.presence
                  const isTerminated = record.isTerminated || record.isClosed

                  return (
                    <React.Fragment key={record.employeeId}>
                      {showSeparator && (
                        <TableRow className="hover:bg-transparent h-2">
                          <TableCell colSpan={6} className="p-0 bg-muted">
                          </TableCell>
                        </TableRow>
                      )}
                      <TableRow 
                        className={cn(
                          record.isClosed && "bg-muted/50",
                          isAbsent && presenceType && ABSENCE_CONFIG[presenceType]?.bg,
                          record.employeeId === focusedEmployeeId && "bg-slate-200/60",
                          isTerminated && "opacity-60 bg-slate-50"
                        )}
                      >
                        <TableCell className="font-medium">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2 group">
                              <span className={cn(isAbsent && presenceType && ABSENCE_CONFIG[presenceType]?.text, isAbsent && "font-bold")}>
                                {record.employeeName}
                              </span>
                              <button
                                onClick={() => {
                                  if (onEmployeeFilterChange) {
                                    onEmployeeFilterChange(employeeNameFilter === record.employeeName ? "" : record.employeeName)
                                  }
                                }}
                                className={`p-1 rounded-md transition-colors cursor-pointer ${
                                  employeeNameFilter === record.employeeName 
                                    ? "bg-primary text-primary-foreground" 
                                    : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted"
                                }`}
                                title={employeeNameFilter === record.employeeName ? "Limpar filtro" : "Filtrar por este funcionário"}
                              >
                                <Search className="h-3 w-3" />
                              </button>
                            </div>
                            {isAbsent && presenceType && (
                              <span className={cn("text-[10px] font-bold uppercase", ABSENCE_CONFIG[presenceType]?.text)}>
                                {ABSENCE_CONFIG[presenceType]?.label || presenceType}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-2 text-center">
                          <div className="flex flex-col items-center justify-center gap-1">
                            {isTerminated && record.terminationDate && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="bg-slate-100 text-slate-600 text-[9px] font-black px-1 py-0.5 rounded border border-slate-200 shadow-sm whitespace-nowrap cursor-help">
                                      ENCERRADO
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Contrato encerrado em {new Date(new Date(record.terminationDate).toISOString().split('T')[0] + "T12:00:00").toLocaleDateString("pt-BR")}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            {dailyWage && dailyWage.valueInCents > 0 && (
                              <div title={`Diária: ${formatCurrency(dailyWage.valueInCents)}`}>
                                <div className="bg-orange-100 text-orange-700 text-[9px] font-black px-1 py-0.5 rounded border border-orange-200 shadow-sm whitespace-nowrap">
                                  {formatCurrency(dailyWage.valueInCents).replace(",00", "")}
                                </div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="flex justify-center py-2">
                          <ToggleGroup 
                            type="single" 
                            size="sm"
                            value={record.plantingCategory || "NONE"} 
                            onValueChange={(val) => {
                              handleCategoryChange(record.employeeId, (val === "NONE" || !val) ? "" : val)
                            }}
                            disabled={isTerminated}
                          >
                            <ToggleGroupItem value="PLANTIO" aria-label="Plantio" className="data-[state=on]:bg-emerald-100 data-[state=on]:text-emerald-900 border border-transparent data-[state=on]:border-emerald-200">
                              <Sprout className="h-3.5 w-3.5" />
                            </ToggleGroupItem>
                            <ToggleGroupItem value="CORTE" aria-label="Corte" className="data-[state=on]:bg-amber-100 data-[state=on]:text-amber-900 border border-transparent data-[state=on]:border-amber-200">
                              <Scissors className="h-3.5 w-3.5" />
                            </ToggleGroupItem>
                          </ToggleGroup>
                        </TableCell>
                        {(selectedCategories.length === 0 || selectedCategories.includes("PLANTIO")) && (
                          <TableCell className="text-center">
                            <SmartNumberInput
                              value={record.plantingMeters || 0}
                              onChange={(val) => handleInputChange(record.employeeId, "plantingMeters", val)}
                              onFocus={() => setFocusedEmployeeId(record.employeeId)}
                              onBlur={() => setFocusedEmployeeId(null)}
                              onKeyDownCustom={(e) => handleKeyDown(e, record.employeeId, "plantingMeters")}
                              disabled={isTerminated}
                              className={cn("h-8 text-right w-24", isTerminated && "bg-slate-100 cursor-not-allowed")}
                            />
                          </TableCell>
                        )}
                        {(selectedCategories.length === 0 || selectedCategories.includes("CORTE")) && (
                          <TableCell className="text-center">
                            <SmartNumberInput
                              value={record.cuttingMeters || 0}
                              onChange={(val) => handleInputChange(record.employeeId, "cuttingMeters", val)}
                              onFocus={() => setFocusedEmployeeId(record.employeeId)}
                              onBlur={() => setFocusedEmployeeId(null)}
                              onKeyDownCustom={(e) => handleKeyDown(e, record.employeeId, "cuttingMeters")}
                              disabled={record.isClosed}
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
                <TableCell className="text-right" colSpan={2}>Total</TableCell>
                <TableCell></TableCell>
                {(selectedCategories.length === 0 || selectedCategories.includes("PLANTIO")) && (
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <span>{totalPlanting} m</span>
                      <span className="text-[10px] text-muted-foreground font-normal">
                        {(totalPlanting / areaHectarePlantio).toLocaleString("pt-BR", { 
                          minimumFractionDigits: 3,
                          maximumFractionDigits: 3 
                        })} h
                      </span>
                    </div>
                  </TableCell>
                )}
                {(selectedCategories.length === 0 || selectedCategories.includes("CORTE")) && (
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <span>{totalCutting} m</span>
                      <span className="text-[10px] text-muted-foreground font-normal">
                        {(totalCutting / areaHectareCorte).toLocaleString("pt-BR", { 
                          minimumFractionDigits: 3,
                          maximumFractionDigits: 3 
                        })} h
                      </span>
                    </div>
                  </TableCell>
                )}
                <TableCell className="text-right text-emerald-600">
                  {formatCurrency(Math.round(totalValue))}
                </TableCell>
              </TableRow>
            </TableHeader>
          </Table>
        </div>
        <div className="flex justify-end mt-4">
          <Button ref={saveButtonRef} onClick={handleSave} disabled={!isEditing || createProductionMutation.isPending}>
            <Save className="h-4 w-4" /> Salvar Alterações
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
