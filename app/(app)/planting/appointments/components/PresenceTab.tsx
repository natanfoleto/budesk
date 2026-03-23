"use client"

import { AttendanceType } from "@prisma/client"
import { CircleSlash, CloudOff, Save, Scissors, Search, Sprout } from "lucide-react"
import React, { useEffect, useState } from "react"
import { toast } from "sonner"

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { cn } from "@/lib/utils"
import { isEmployeeActiveAtDate, shouldShowEmployeeInMonth } from "@/lib/utils/planting-utils"
import { EmployeeDetailsModal } from "@/src/modules/planting/components/EmployeeDetailsModal"
import { EmployeeWithDetails } from "@/types/employee"
import { DailyWage, DailyWageFormData, PlantingProduction } from "@/types/planting"

interface PresenceTabProps {
  seasonId: string
  frontId: string
  date: string
  employeeNameFilter?: string
  onEmployeeFilterChange?: (name: string) => void
  selectedTagIds?: string[]
  isPeriodClosed: boolean
}

interface PresenceRecord {
  id?: string
  employeeId: string
  employeeName: string
  presence: AttendanceType
  notes: string
  isClosed: boolean
  plantingCategory: string
  isTerminated: boolean
  terminationDate?: string | Date | null
  valueInCents: number
}

const PRESENCE_CONFIG: Record<string, { label: string; color: string; textColor: string }> = {
  PRESENCA: { label: "Presente", color: "bg-green-500", textColor: "text-white" },
  FALTA: { label: "Falta", color: "bg-red-500", textColor: "text-white" },
  FALTA_JUSTIFICADA: { label: "Falta Justificada", color: "bg-orange-500", textColor: "text-white" },
  ATESTADO: { label: "Atestado", color: "bg-blue-500", textColor: "text-white" },
  FOLGA: { label: "Folga", color: "bg-slate-400", textColor: "text-white" }
}

const ABSENCE_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  FALTA: { bg: "bg-red-50/50 hover:bg-red-50", text: "text-red-600", label: "FALTA" },
  FALTA_JUSTIFICADA: { bg: "bg-orange-50/50 hover:bg-orange-50", text: "text-orange-600", label: "FALTA JUST." },
  ATESTADO: { bg: "bg-blue-50/50 hover:bg-blue-50", text: "text-blue-600", label: "ATESTADO" },
  FOLGA: { bg: "bg-slate-50/50 hover:bg-slate-50", text: "text-slate-600", label: "FOLGA" }
}

const getPresenceLabel = (type: AttendanceType) => PRESENCE_CONFIG[type]?.label || type

export function PresenceTab({ 
  seasonId, 
  frontId, 
  date, 
  employeeNameFilter = "", 
  onEmployeeFilterChange, 
  selectedTagIds = [],
  isPeriodClosed 
}: PresenceTabProps) {
  const [presence, setPresence] = useState<Record<string, PresenceRecord>>({})
  const [isEditing, setIsEditing] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [highlightedRow, setHighlightedRow] = useState<string | null>(null)
  const [selectedEmployeeForModal, setSelectedEmployeeForModal] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showConfirmBulk, setShowConfirmBulk] = useState(false)

  const { data: employees, isLoading: isLoadingEmployees } = useEmployees({ tagIds: selectedTagIds })
  const { data: attendanceRecords, isLoading: isLoadingAttendance, refetch } = useDailyWages({
    seasonId,
    frontId,
    date: date ? `${date}T00:00:00Z` : undefined,
    tagIds: selectedTagIds
  })
  
  const { data: productions } = usePlantingProductions({
    seasonId,
    frontId,
    date: date ? `${date}T00:00:00Z` : undefined,
    tagIds: selectedTagIds
  })
  
  const createDailyWageMutation = useCreateDailyWage()

  useEffect(() => {
    if (employees && attendanceRecords) {
      const state: Record<string, PresenceRecord> = {}
      
      // Filter employees based on termination date
      const dataEmployees = (employees?.data || []) as EmployeeWithDetails[]
      const dataAttendance = (attendanceRecords || []) as DailyWage[]
      
      const filteredEmployees = dataEmployees.filter(emp => shouldShowEmployeeInMonth(date, emp.terminationDate))

      filteredEmployees.forEach((emp) => {
        const existing = dataAttendance.find((dw) => dw.employeeId === emp.id)
        state[emp.id] = {
          id: existing?.id,
          employeeId: emp.id,
          employeeName: emp.name,
          presence: existing?.presence || "PRESENCA",
          notes: existing?.notes || "",
          isClosed: isPeriodClosed,
          plantingCategory: emp.plantingCategory || "",
          isTerminated: !isEmployeeActiveAtDate(date, emp.terminationDate),
          terminationDate: emp.terminationDate,
          valueInCents: existing?.valueInCents || 0
        }
      })
      setPresence(state)
      setIsEditing(false)
    }
  }, [employees, attendanceRecords, isPeriodClosed, date])

  const handleSave = async () => {
    const toSave: DailyWageFormData[] = []

    for (const r of Object.values(presence)) {
      // Skip terminated employees as they are read-only in the UI
      if (r.isTerminated) continue

      if (r.presence !== "PRESENCA") {
        if (r.valueInCents > 0) {
          toast.error(`O funcionário ${r.employeeName} não pode ser marcado como ${getPresenceLabel(r.presence)} pois possui valor de diária registrado.`)
          return
        }

        const hasProduction = (productions as PlantingProduction[])?.some((p) => p.employeeId === r.employeeId && (p.meters || 0) > 0)
        if (hasProduction) {
          toast.error(`O funcionário ${r.employeeName} não pode ser marcado como ${getPresenceLabel(r.presence)} pois possui metragem de plantio/corte registrada.`)
          return
        }
      }

      toSave.push({
        id: r.id,
        employeeId: r.employeeId,
        frontId: frontId,
        seasonId: seasonId,
        date: new Date(date).toISOString(),
        presence: r.presence,
        valueInCents: r.valueInCents
      })
    }

    try {
      await Promise.all(toSave.map(payload => createDailyWageMutation.mutateAsync(payload)))
      toast.success("Presenças salvas com sucesso!")
      setIsEditing(false)
      refetch()
    } catch {
      // Error handled by hook
    }
  }

  const updateLocalPresence = (empId: string, field: keyof PresenceRecord, value: string | number | AttendanceType | Date | null) => {
    setIsEditing(true)
    setPresence(prev => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        [field]: value
      }
    }))
  }

  const sortedEmployees = Object.values(presence)
    .filter((a) => {
      const matchesName =
        employeeNameFilter.trim() === "" ||
        a.employeeName.toLowerCase().includes(employeeNameFilter.toLowerCase())
      
      const matchesType = selectedCategories.length === 0 || selectedCategories.includes(a.plantingCategory || "")

      return matchesName && matchesType
    })
    .sort((a, b) => a.employeeName.localeCompare(b.employeeName))

  const handleMarkAllNotWorked = () => {
    setIsEditing(true)
    const newState = { ...presence }
    sortedEmployees.forEach(emp => {
      if (!emp.isTerminated && !emp.isClosed) {
        newState[emp.employeeId] = {
          ...newState[emp.employeeId],
          presence: "FOLGA" as AttendanceType
        }
      }
    })
    setPresence(newState)
    setShowConfirmBulk(false)
  }

  if (seasonId === "all" || frontId === "all" || !date) {
    return (
      <Card>
        <CardContent className="flex h-40 items-center justify-center text-muted-foreground p-6">
          Selecione a Safra, Frente de Trabalho e Data acima para gerenciar Presenças.
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg">Presença e Faltas</CardTitle>
            <CardDescription>
              Controle de presença diária da equipe.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowConfirmBulk(true)}
              disabled={isPeriodClosed}
              variant="outline"
            >
              <CloudOff className="h-4 w-4" />
              Marcar todos como Folga
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!isEditing || createDailyWageMutation.isPending}
            >
              <Save className="h-4 w-4" />
              Salvar Alterações
            </Button>
          </div>
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
                  <TableHead className="w-[250px] text-right">Status de Presença</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingEmployees || isLoadingAttendance ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-10 w-full ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : sortedEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center">
                      Nenhum funcionário encontrado com os filtros atuais.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedEmployees.map((record) => {
                    const isTerminated = record.isTerminated
                    
                    return (
                      <TableRow 
                        key={record.employeeId} 
                        className={cn(
                          highlightedRow === record.employeeId ? "bg-accent/40" : "",
                          isTerminated && "opacity-60 bg-slate-50",
                          record.isClosed && "bg-muted/50",
                          record.presence && record.presence !== "PRESENCA" && ABSENCE_CONFIG[record.presence]?.bg
                        )}
                        onMouseEnter={() => setHighlightedRow(record.employeeId)}
                        onMouseLeave={() => setHighlightedRow(null)}
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
                                {ABSENCE_CONFIG[record.presence]?.label || record.presence}
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
                                    <div className="bg-slate-100 text-slate-600 text-[9px] font-black px-1 py-0.5 rounded border border-slate-200 shadow-sm whitespace-nowrap cursor-help uppercase">
                                      ENCERRADO
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Contrato encerrado em {new Date(new Date(record.terminationDate).toISOString().split('T')[0] + "T12:00:00").toLocaleDateString("pt-BR")}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            {record.valueInCents > 0 && (
                              <div title={`Diária: ${(record.valueInCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`}>
                                <div className="bg-orange-100 text-orange-700 text-[9px] font-black px-1 py-0.5 rounded border border-orange-200 shadow-sm whitespace-nowrap">
                                  {(record.valueInCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }).replace(",00", "")}
                                </div>
                              </div>
                            )}
                            {(() => {
                              const employeeMetrage = (productions as PlantingProduction[])?.filter(p => p.employeeId === record.employeeId && (p.meters || 0) > 0)
                              const types = Array.from(new Set(employeeMetrage?.map(p => p.type) || []))
                              if (types.length === 0) return null
                              return (
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
                              )
                            })()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={record.presence} 
                            onValueChange={(val: AttendanceType) => updateLocalPresence(record.employeeId, "presence", val)}
                            disabled={isTerminated || record.isClosed}
                          >
                            <SelectTrigger className={cn("h-8 w-[200px] ml-auto", record.presence !== "PRESENCA" && ABSENCE_CONFIG[record.presence]?.bg)}>
                              <SelectValue placeholder="Status de Presença" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(PRESENCE_CONFIG).map(([value, { label, color }]) => (
                                <SelectItem key={value} value={value}>
                                  <div className="flex items-center gap-2">
                                    <span className={`h-2 w-2 rounded-full ${color}`} />
                                    {label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmBulk} onOpenChange={setShowConfirmBulk}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Ação em Massa</AlertDialogTitle>
            <AlertDialogDescription>
              Isso alterará o status de todos os funcionários visíveis na tabela para <strong>Folga</strong>. 
              Você poderá ajustar individualmente após confirmar. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleMarkAllNotWorked}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <EmployeeDetailsModal
        employeeId={selectedEmployeeForModal}
        seasonId={seasonId}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  )
}
