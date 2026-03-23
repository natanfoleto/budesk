"use client"

import { AttendanceType } from "@prisma/client"
import { CircleSlash, Save, Scissors, Search, Sprout } from "lucide-react"
import React, { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useEmployees } from "@/hooks/use-employees"
import { useCreateDailyWage, useDailyWages, usePlantingProductions } from "@/hooks/use-planting"
import { cn, formatCentsToReal } from "@/lib/utils"
import { isEmployeeActiveAtDate, shouldShowEmployeeInMonth } from "@/lib/utils/planting-utils"
import { EmployeeDetailsModal } from "@/src/modules/planting/components/EmployeeDetailsModal"
import { EmployeeWithDetails } from "@/types/employee"
import { DailyWage, DailyWageFormData, PlantingProduction } from "@/types/planting"

interface DailyWageTabProps {
  seasonId: string
  frontId: string
  date: string
  employeeNameFilter?: string
  onEmployeeFilterChange?: (name: string) => void
  selectedTagIds?: string[]
  isPeriodClosed: boolean
}

interface WageRecord {
  id?: string
  employeeId: string
  employeeName: string
  presence: AttendanceType
  notes: string
  isTerminated: boolean
  terminationDate?: string | Date | null
  value: number // Value in real (e.g., 100.50)
  valueFormatted: string
  isClosed: boolean
  plantingCategory: string
}

const ABSENCE_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  FALTA: { bg: "bg-red-50/50 hover:bg-red-50", text: "text-red-600", label: "FALTA" },
  FALTA_JUSTIFICADA: { bg: "bg-orange-50/50 hover:bg-orange-50", text: "text-orange-600", label: "FALTA JUST." },
  ATESTADO: { bg: "bg-blue-50/50 hover:bg-blue-50", text: "text-blue-600", label: "ATESTADO" },
  FOLGA: { bg: "bg-slate-50/50 hover:bg-slate-50", text: "text-slate-600", label: "FOLGA" }
}

export function DailyWageTab({ 
  seasonId, 
  frontId, 
  date, 
  employeeNameFilter = "", 
  onEmployeeFilterChange, 
  selectedTagIds = [],
  isPeriodClosed 
}: DailyWageTabProps) {
  const [wages, setWages] = useState<Record<string, WageRecord>>({})
  const [isEditing, setIsEditing] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [highlightedRow, setHighlightedRow] = useState<string | null>(null)
  const [selectedEmployeeForModal, setSelectedEmployeeForModal] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const saveButtonRef = useRef<HTMLButtonElement>(null)

  // Fetch all active employees via shared hook
  const { data: employees, isLoading: isLoadingEmployees } = useEmployees({ tagIds: selectedTagIds })

  // Fetch existing daily wages via shared hook
  const { data: existingRecords, isLoading: isLoadingRecords, refetch } = useDailyWages({
    seasonId,
    frontId,
    date: date ? `${date}T00:00:00Z` : undefined,
    tagIds: selectedTagIds
  })
  
  // Fetch existing productions to show indicators
  const { data: productions } = usePlantingProductions({
    seasonId,
    frontId,
    date: date ? `${date}T00:00:00Z` : undefined,
    tagIds: selectedTagIds
  })

  const createDailyWageMutation = useCreateDailyWage()

  useEffect(() => {
    if (employees && existingRecords) {
      const state: Record<string, WageRecord> = {}
      
      // Filter employees based on termination date
      const employeeList = employees?.data || []
      const filteredEmployees = (employeeList as EmployeeWithDetails[] || []).filter(emp => shouldShowEmployeeInMonth(date, emp.terminationDate))

      filteredEmployees.forEach((emp) => {
        const existing = (existingRecords as DailyWage[] || []).find((dw) => dw.employeeId === emp.id)
        state[emp.id] = {
          id: existing?.id,
          employeeId: emp.id,
          employeeName: emp.name,
          value: existing?.valueInCents ? existing.valueInCents / 100 : 0,
          presence: existing?.presence || "PRESENCA",
          notes: existing?.notes || "",
          isTerminated: !isEmployeeActiveAtDate(date, emp.terminationDate),
          terminationDate: emp.terminationDate,
          valueFormatted: existing?.valueInCents ? formatCentsToReal(existing.valueInCents) : "",
          isClosed: isPeriodClosed,
          plantingCategory: emp.plantingCategory || ""
        }
      })
      
      setWages(state)
      setIsEditing(false)
    }
  }, [employees, existingRecords, isPeriodClosed, date])

  const handleSave = async () => {
    const toSave: DailyWageFormData[] = []

    for (const r of Object.values(wages)) {
      // Skip terminated employees as they are read-only in the UI
      if (r.isTerminated) continue

      const valueInCents = Math.round(r.value * 100)

      if (valueInCents > 0) {
        // Validation: Must be PRESENCA
        if (r.presence !== "PRESENCA") {
          toast.error(`O funcionário ${r.employeeName} não pode ter valor de diária pois está marcado como ${r.presence === "FOLGA" ? "Folga" : "Falta/Atestado"} neste dia.`)
          return
        }
      }

      // If a record exists, we always update it (preserving the presence status)
      if (r.id) {
        toSave.push({
          id: r.id,
          employeeId: r.employeeId,
          frontId: frontId,
          seasonId: seasonId,
          date: new Date(date).toISOString(),
          presence: r.presence,
          valueInCents: valueInCents
        })
      } else if (valueInCents > 0 || r.presence !== "PRESENCA") {
        // If no record exists but user entered a value or changed presence, create it
        toSave.push({
          employeeId: r.employeeId,
          frontId: frontId,
          seasonId: seasonId,
          date: new Date(date).toISOString(),
          presence: r.presence,
          valueInCents: valueInCents
        })
      }
    }

    try {
      if (toSave.length > 0) {
        await Promise.all(toSave.map(payload => createDailyWageMutation.mutateAsync(payload)))
      }
      toast.success("Diárias salvas com sucesso!")
      setIsEditing(false)
      refetch()
    } catch {
      // Error handled by hook
    }
  }

  const updateLocalWage = (empId: string, field: keyof WageRecord, rawValue: string | number | AttendanceType) => {
    setIsEditing(true)
    setWages(prev => {
      const currentRecord = prev[empId]
      let updatedValue = rawValue
      let updatedValueFormatted = currentRecord.valueFormatted

      if (field === "value") {
        const valueStr = String(rawValue)
        const digits = valueStr.replace(/\D/g, "")
        const cents = Number(digits)
        updatedValue = cents / 100
        updatedValueFormatted = cents > 0 ? formatCentsToReal(cents) : ""
      }

      return {
        ...prev,
        [empId]: {
          ...currentRecord,
          [field]: updatedValue,
          ...(field === "value" && { valueFormatted: updatedValueFormatted })
        }
      }
    })
  }

  if (seasonId === "all" || frontId === "all" || !date) {
    return (
      <Card>
        <CardContent className="flex h-40 items-center justify-center text-muted-foreground p-6">
          Selecione a Safra, Frente de Trabalho e Data acima para gerenciar Diárias.
        </CardContent>
      </Card>
    )
  }

  const sortedEmployees = Object.values(wages)
    .filter((a: WageRecord) => {
      const matchesName =
        employeeNameFilter.trim() === "" ||
        a.employeeName.toLowerCase().includes(employeeNameFilter.toLowerCase())
      
      const matchesType = selectedCategories.length === 0 || selectedCategories.includes(a.plantingCategory || "")

      return matchesName && matchesType
    })
    .sort((a, b) => a.employeeName.localeCompare(b.employeeName))

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg">Diárias (Valores)</CardTitle>
          <CardDescription>
            Lançamento financeiro das diárias. Não altera o status de falta/presença.
          </CardDescription>
        </div>
        <Button ref={saveButtonRef} onClick={handleSave} disabled={!isEditing || createDailyWageMutation.isPending}>
          <Save className="h-4 w-4" /> Salvar Alterações
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-6 items-center rounded-md border p-3 bg-muted/20">
          <div className="ml-auto flex items-center gap-1">
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
                <TableHead className="w-[100px] text-center"></TableHead>
                <TableHead className="w-[120px] text-right">Valor Diária (R$)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingEmployees || isLoadingRecords ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-32 ml-auto" /></TableCell>
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
                  const isTerminated = record.isTerminated
                  const employeeProductions = (productions as PlantingProduction[])?.filter((p) => p.employeeId === record.employeeId && (p.meters || 0) > 0)
                  const metrage = employeeProductions?.length > 0
                  const types = Array.from(new Set(employeeProductions?.map((p) => p.type) || []))

                  return (
                    <TableRow 
                      key={record.employeeId} 
                      className={cn(
                        highlightedRow === record.employeeId ? "bg-accent/40" : "",
                        isTerminated && "opacity-60 bg-slate-50",
                        record.isClosed && "bg-muted/50",
                        record.presence && record.presence !== "PRESENCA" && ABSENCE_CONFIG[record.presence]?.bg,
                      )}
                    >
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2 group">
                            <span 
                              className={cn(
                                "cursor-pointer hover:underline decoration-primary/50 underline-offset-4 transition-all",
                                record.presence !== "PRESENCA" && ABSENCE_CONFIG[record.presence]?.text, 
                                record.presence !== "PRESENCA" && "font-bold"
                              )}
                              onClick={() => {
                                setSelectedEmployeeForModal(record.employeeId)
                                setIsModalOpen(true)
                              }}
                            >
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
                              <Search className="size-3" />
                            </button>
                          </div>
                          {record.presence !== "PRESENCA" && (
                            <span className={cn("text-[10px] font-bold uppercase", ABSENCE_CONFIG[record.presence]?.text)}>
                              {ABSENCE_CONFIG[record.presence]?.label}
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
                          {metrage && types.length > 0 && (
                            <div className="flex gap-0.5">
                              {types.map((type) => (
                                <span key={`${record.employeeId}-${type}`} className={cn(
                                  "flex items-center justify-center w-5 h-5 rounded-full border",
                                  type === "PLANTIO" ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-amber-50 border-amber-200 text-amber-600"
                                )}>
                                  {type === "PLANTIO" ? <Sprout className="h-3 w-3" /> : <Scissors className="h-3 w-3" />}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="text" // Changed to text to allow custom formatting
                          className={cn("h-8 text-right w-24", isTerminated && "bg-slate-100 cursor-not-allowed")}
                          value={record.valueFormatted}
                          onChange={(e) => updateLocalWage(record.employeeId, "value", e.target.value)}
                          onFocus={(e) => {
                            setHighlightedRow(record.employeeId)
                            e.target.select()
                          }}
                          onBlur={() => setHighlightedRow(null)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && index === sortedEmployees.length - 1 && saveButtonRef.current) {
                              e.preventDefault()
                              saveButtonRef.current.focus()
                            } else if (e.key === "Enter") {
                              e.preventDefault()
                              const table = e.currentTarget.closest('table')
                              if (table) {
                                const inputs = Array.from(table.querySelectorAll('input:not([disabled])')) as HTMLInputElement[]
                                const currentInputIndex = inputs.indexOf(e.currentTarget)
                                if (currentInputIndex > -1 && currentInputIndex < inputs.length - 1) {
                                  inputs[currentInputIndex + 1].focus()
                                  inputs[currentInputIndex + 1].select()
                                }
                              }
                            }
                          }}
                          disabled={isTerminated || record.isClosed || record.presence !== "PRESENCA"}
                          placeholder="R$ 0,00"
                        />
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <EmployeeDetailsModal
        employeeId={selectedEmployeeForModal}
        seasonId={seasonId}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </Card>
  )
}
