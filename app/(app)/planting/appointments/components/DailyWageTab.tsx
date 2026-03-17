"use client"

import { AttendanceType } from "@prisma/client"
import { Save, Search } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useEmployees } from "@/hooks/use-employees"
import { useCreateDailyWage, useDailyWages, usePlantingParameters } from "@/hooks/use-planting"
import { DailyWage, DailyWageFormData, PlantingParameter } from "@/types/planting"

interface DailyWageTabProps {
  seasonId: string
  frontId: string
  date: string
  employeeNameFilter?: string
  onEmployeeFilterChange?: (name: string) => void
  isPeriodClosed: boolean
}

type WageRecord = {
  id?: string
  employeeId: string
  employeeName: string
  presence: boolean
  dailyValueInCents: number
  isClosed: boolean
}

export function DailyWageTab({ seasonId, frontId, date, employeeNameFilter = "", onEmployeeFilterChange, isPeriodClosed }: DailyWageTabProps) {
  const [wages, setWages] = useState<Record<string, WageRecord>>({})
  const [isEditing, setIsEditing] = useState(false)

  // Fetch all active employees via shared hook
  const { data: employees, isLoading: isLoadingEmployees } = useEmployees()

  // Fetch existing daily wages via shared hook
  const { data: existingRecords, isLoading: isLoadingRecords, refetch } = useDailyWages({
    seasonId,
    frontId,
    date: date ? `${date}T00:00:00Z` : undefined
  })

  // Fetch standard values for default daily wage via shared hook
  const { data: parameters } = usePlantingParameters()

  const createDailyWageMutation = useCreateDailyWage()

  useEffect(() => {
    if (employees && existingRecords && parameters) {
      const state: Record<string, WageRecord> = {}
      
      const defaultWageParam = parameters?.find((p: PlantingParameter) => p.key === "valor_diaria")
      const defaultWageInCents = defaultWageParam ? Number(defaultWageParam.value) : 9000 // default 90 BRL

      employees.forEach((emp: { id: string; name: string }) => {
        state[emp.id] = {
          employeeId: emp.id,
          employeeName: emp.name,
          presence: false,
          dailyValueInCents: defaultWageInCents,
          isClosed: isPeriodClosed
        }
      })

      existingRecords.forEach((rec: DailyWage) => {
        if (state[rec.employeeId]) {
          state[rec.employeeId].id = rec.id
          state[rec.employeeId].presence = rec.presence === AttendanceType.PRESENCA
          state[rec.employeeId].dailyValueInCents = rec.valueInCents
          // isClosed comes from isPeriodClosed, not per-record
        }
      })
      
      setWages(state)
      setIsEditing(false)
    }
  }, [employees, existingRecords, parameters, isPeriodClosed])

  const handleSave = async () => {
    const toSave: DailyWageFormData[] = []
    Object.values(wages).forEach(w => {
      if (w.presence) {
        toSave.push({
          employeeId: w.employeeId,
          frontId: frontId,
          seasonId: seasonId,
          date: `${date}T12:00:00.000Z`,
          presence: AttendanceType.PRESENCA,
          valueInCents: w.dailyValueInCents
        })
      }
    })

    if (toSave.length === 0) {
      toast.info("Nenhuma diária marcada.")
      return
    }

    // Validation: Check if any employee has daily wage but is marked as absent in Presence
    const employeesWithWage = new Set(toSave.map(p => p.employeeId))
    const conflictAbsences = existingRecords?.filter((rec: DailyWage) => 
      employeesWithWage.has(rec.employeeId) && 
      rec.presence !== "PRESENCA"
    ) || []

    if (conflictAbsences.length > 0) {
      const names = conflictAbsences.map((a: DailyWage) => a.employee?.name || "Funcionário").join(", ")
      toast.error(`Não é possível registrar diária para: ${names}. Eles estão marcados com Falta/Atestado/Justificado neste dia.`)
      return
    }

    try {
      await Promise.all(toSave.map(payload => createDailyWageMutation.mutateAsync(payload)))
      toast.success("Diárias salvas com sucesso!")
      setIsEditing(false)
      refetch()
    } catch {
      // Error already handled by hook toast
    }
  }

  const handlePresenceChange = (empId: string, checked: boolean) => {
    setIsEditing(true)
    setWages(prev => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        presence: checked
      }
    }))
  }

  const handleValueChange = (empId: string, val: string) => {
    setIsEditing(true)
    const num = Number(val)
    setWages(prev => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        dailyValueInCents: isNaN(num) ? 0 : Math.round(num * 100)
      }
    }))
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
    .filter((a) =>
      employeeNameFilter.trim() === "" ||
      a.employeeName.toLowerCase().includes(employeeNameFilter.toLowerCase())
    )
    .sort((a, b) => a.employeeName.localeCompare(b.employeeName))

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg">Diárias</CardTitle>
          <CardDescription>
            Apontamento de diaristas na frente de trabalho para a data selecionada.
          </CardDescription>
        </div>
        <Button onClick={handleSave} disabled={!isEditing || createDailyWageMutation.isPending}>
          <Save className="h-4 w-4" /> Salvar Alterações
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Funcionário</TableHead>
                <TableHead className="w-[120px] text-center">Presença</TableHead>
                <TableHead className="w-[150px] text-right">Valor Diária (R$)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingEmployees || isLoadingRecords ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-10 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : sortedEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    Nenhum funcionário encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                sortedEmployees.map((record) => (
                  <TableRow key={record.employeeId} className={record.isClosed ? "bg-muted/50" : ""}>
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
                    <TableCell className="text-center">
                      <Switch
                        checked={record.presence}
                        onCheckedChange={(c) => handlePresenceChange(record.employeeId, c)}
                        disabled={record.isClosed}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        className="h-8 text-right"
                        value={record.dailyValueInCents === 0 ? "" : (record.dailyValueInCents / 100).toFixed(2)}
                        onChange={(e) => handleValueChange(record.employeeId, e.target.value)}
                        disabled={!record.presence || record.isClosed}
                        placeholder="0.00"
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
