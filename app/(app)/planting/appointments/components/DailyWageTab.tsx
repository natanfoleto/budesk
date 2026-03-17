"use client"

import { AttendanceType } from "@prisma/client"
import { Save, Search } from "lucide-react"
import { useEffect, useState } from "react"
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
import { useEmployees } from "@/hooks/use-employees"
import { useCreateDailyWage, useDailyWages } from "@/hooks/use-planting"
import { formatCentsToReal } from "@/lib/utils"
import { DailyWage, DailyWageFormData } from "@/types/planting"

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
  originalPresence?: AttendanceType
  valueInCents: number
  valueFormatted: string
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

  const createDailyWageMutation = useCreateDailyWage()

  useEffect(() => {
    if (employees && existingRecords) {
      const state: Record<string, WageRecord> = {}
      
      employees.forEach((emp: { id: string; name: string }) => {
        state[emp.id] = {
          employeeId: emp.id,
          employeeName: emp.name,
          originalPresence: undefined,
          valueInCents: 0,
          valueFormatted: "",
          isClosed: isPeriodClosed
        }
      })

      existingRecords.forEach((rec: DailyWage) => {
        if (state[rec.employeeId]) {
          state[rec.employeeId].id = rec.id
          state[rec.employeeId].originalPresence = rec.presence
          state[rec.employeeId].valueInCents = rec.valueInCents
          state[rec.employeeId].valueFormatted = rec.valueInCents > 0 ? formatCentsToReal(rec.valueInCents) : ""
        }
      })
      
      setWages(state)
      setIsEditing(false)
    }
  }, [employees, existingRecords, isPeriodClosed])

  const handleSave = async () => {
    const toSave: DailyWageFormData[] = []

    for (const r of Object.values(wages)) {
      if (r.valueInCents > 0) {
        // Validation: Must be PRESENCA
        const presence = r.originalPresence || "PRESENCA"
        if (presence !== "PRESENCA") {
          toast.error(`O funcionário ${r.employeeName} não pode ter valor de diária pois está marcado como ${presence === "NAO_TRABALHADO" ? "Não Trabalhado" : "Falta/Atestado"} neste dia.`)
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
          presence: r.originalPresence || "PRESENCA",
          valueInCents: r.valueInCents
        })
      } else if (r.valueInCents > 0) {
        // If no record exists but user entered a value, create it as PRESENCA
        toSave.push({
          employeeId: r.employeeId,
          frontId: frontId,
          seasonId: seasonId,
          date: new Date(date).toISOString(),
          presence: "PRESENCA",
          valueInCents: r.valueInCents
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

  const handleValueChange = (empId: string, rawValue: string) => {
    setIsEditing(true)
    const digitsOnly = rawValue.replace(/\D/g, "")
    const cents = digitsOnly ? Number(digitsOnly) : 0
    const formatted = cents > 0 ? formatCentsToReal(cents) : ""

    setWages(prev => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        valueInCents: cents,
        valueFormatted: formatted
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
          <CardTitle className="text-lg">Diárias (Valores)</CardTitle>
          <CardDescription>
            Lançamento financeiro das diárias. Não altera o status de falta/presença.
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
                <TableHead className="w-[150px] text-right">Valor Diária (R$)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingEmployees || isLoadingRecords ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-32 ml-auto" /></TableCell>
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
                    <TableCell>
                      <Input
                        type="text"
                        className="h-8 text-right"
                        value={record.valueFormatted}
                        onChange={(e) => handleValueChange(record.employeeId, e.target.value)}
                        disabled={record.isClosed}
                        placeholder="R$ 0,00"
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
