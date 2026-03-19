"use client"

import { AttendanceType, Employee } from "@prisma/client"
import { CloudOff, Save, Search } from "lucide-react"
import { useEffect, useState } from "react"
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
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
import { useEmployees } from "@/hooks/use-employees"
import { useCreateDailyWage, useDailyWages, usePlantingProductions } from "@/hooks/use-planting"
import { cn } from "@/lib/utils"
import { DailyWage, DailyWageFormData, PlantingProduction } from "@/types/planting"

interface PresenceTabProps {
  seasonId: string
  frontId: string
  date: string
  employeeNameFilter?: string
  onEmployeeFilterChange?: (name: string) => void
  isPeriodClosed: boolean
}

interface PresenceRecord {
  id?: string
  employeeId: string
  employeeName: string
  presence: AttendanceType
  valueInCents: number
  isClosed: boolean
  plantingCategory: string
}

const PRESENCE_CONFIG: Record<string, { label: string; color: string; textColor: string }> = {
  PRESENCA: { label: "Presente", color: "bg-green-500", textColor: "text-white" },
  FALTA: { label: "Falta", color: "bg-red-500", textColor: "text-white" },
  FALTA_JUSTIFICADA: { label: "Falta Justificada", color: "bg-orange-500", textColor: "text-white" },
  ATESTADO: { label: "Atestado", color: "bg-blue-500", textColor: "text-white" },
  NAO_TRABALHADO: { label: "Não Trabalhado", color: "bg-slate-400", textColor: "text-white" }
}

const getPresenceLabel = (type: AttendanceType) => PRESENCE_CONFIG[type]?.label || type

export function PresenceTab({ seasonId, frontId, date, employeeNameFilter = "", onEmployeeFilterChange, isPeriodClosed }: PresenceTabProps) {
  const [records, setRecords] = useState<Record<string, PresenceRecord>>({})
  const [isEditing, setIsEditing] = useState(false)
  const [showConfirmBulk, setShowConfirmBulk] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [focusedEmployeeId, setFocusedEmployeeId] = useState<string | null>(null)

  const { data: employees, isLoading: isLoadingEmployees } = useEmployees()
  const { data: existingRecords, isLoading: isLoadingRecords, refetch } = useDailyWages({
    seasonId,
    frontId,
    date: date ? `${date}T00:00:00Z` : undefined
  })
  
  const { data: productions } = usePlantingProductions({
    seasonId,
    frontId,
    date: date ? `${date}T00:00:00Z` : undefined
  })
  
  const createDailyWageMutation = useCreateDailyWage()

  useEffect(() => {
    if (employees && existingRecords) {
      const state: Record<string, PresenceRecord> = {}
      
      employees.forEach((emp: Employee) => {
        state[emp.id] = {
          employeeId: emp.id,
          employeeName: emp.name,
          presence: "PRESENCA",
          valueInCents: 0,
          isClosed: isPeriodClosed,
          plantingCategory: emp.plantingCategory || ""
        }
      })

      existingRecords.forEach((rec: DailyWage) => {
        if (state[rec.employeeId]) {
          state[rec.employeeId].id = rec.id
          state[rec.employeeId].presence = rec.presence
          state[rec.employeeId].valueInCents = rec.valueInCents
        }
      })
      
      setRecords(state)
      setIsEditing(false)
    }
  }, [employees, existingRecords, isPeriodClosed])

  const handleSave = async () => {
    const toSave: DailyWageFormData[] = []

    for (const r of Object.values(records)) {
      // Validation: If NOT PRESENCA, check for production or value conflicts
      if (r.presence !== "PRESENCA") {
        // Check current record's value
        if (r.valueInCents > 0) {
          toast.error(`O funcionário ${r.employeeName} não pode ser marcado como ${getPresenceLabel(r.presence)} pois possui valor de diária registrado.`)
          return
        }

        // Check productions
        const hasProduction = productions?.some((p: PlantingProduction) => p.employeeId === r.employeeId && (p.meters || 0) > 0)
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

  const handlePresenceChange = (empId: string, val: string) => {
    setIsEditing(true)
    setRecords(prev => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        presence: val as AttendanceType
      }
    }))
  }

  const sortedEmployees = Object.values(records)
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
    const newState = { ...records }
    sortedEmployees.forEach(emp => {
      newState[emp.employeeId] = {
        ...newState[emp.employeeId],
        presence: "NAO_TRABALHADO" as AttendanceType
      }
    })
    setRecords(newState)
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
              Marcar todos Não Trabalhado
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
            <div className="ml-auto flex items-center gap-2">
              <Label className="text-sm font-medium whitespace-nowrap">Filtrar por:</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-2">
                    Tipo
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuCheckboxItem
                    checked={selectedCategories.includes("PLANTIO")}
                    onCheckedChange={(checked) => {
                      setSelectedCategories(prev => 
                        checked ? [...prev, "PLANTIO"] : prev.filter(c => c !== "PLANTIO")
                      )
                    }}
                  >
                    Plantio
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedCategories.includes("CORTE")}
                    onCheckedChange={(checked) => {
                      setSelectedCategories(prev => 
                        checked ? [...prev, "CORTE"] : prev.filter(c => c !== "CORTE")
                      )
                    }}
                  >
                    Corte
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedCategories.includes("")}
                    onCheckedChange={(checked) => {
                      setSelectedCategories(prev => 
                        checked ? [...prev, ""] : prev.filter(c => c !== "")
                      )
                    }}
                  >
                    Sem tipo
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Funcionário</TableHead>
                  <TableHead className="w-[250px]">Status de Presença</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingEmployees || isLoadingRecords ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : sortedEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center">
                      Nenhum funcionário encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedEmployees.map((record) => (
                    <TableRow 
                      key={record.employeeId} 
                      className={cn(
                        record.isClosed && "bg-muted/50",
                        record.employeeId === focusedEmployeeId && "bg-slate-200/60"
                      )}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2 group">
                          {record.employeeName}
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
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={record.presence} 
                          onValueChange={(val) => handlePresenceChange(record.employeeId, val)}
                          disabled={record.isClosed}
                          onOpenChange={(open) => setFocusedEmployeeId(open ? record.employeeId : null)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(PRESENCE_CONFIG).map(([value, { label, color }]) => (
                              <SelectItem key={value} value={value}>
                                <div className="flex items-center gap-2">
                                  <span className={`inline-block h-2 w-2 rounded-full shrink-0 ${color}`} />
                                  {label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
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
              Isso alterará o status de todos os funcionários visíveis na tabela para <strong>Não Trabalhado</strong>. 
              Você poderá ajustar individualmente após confirmar. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleMarkAllNotWorked}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
