"use client"

import { AttendanceType } from "@prisma/client"
import { Save } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { useEmployees } from "@/hooks/use-employees"
import { useCreateDailyWage, useDailyWages, useDeleteDailyWage } from "@/hooks/use-planting"
import { DailyWage, DailyWageFormData } from "@/types/planting"

interface PresenceTabProps {
  seasonId: string
  frontId: string
  date: string
}

type PresenceRecord = {
  id?: string
  employeeId: string
  employeeName: string
  presence: AttendanceType | "NENHUM"
  isClosed: boolean
}

export function PresenceTab({ seasonId, frontId, date }: PresenceTabProps) {
  const [records, setRecords] = useState<Record<string, PresenceRecord>>({})
  const [isEditing, setIsEditing] = useState(false)

  const { data: employees, isLoading: isLoadingEmployees } = useEmployees()

  const { data: existingRecords, isLoading: isLoadingRecords, refetch } = useDailyWages({
    seasonId,
    frontId,
    date: date ? `${date}T00:00:00Z` : undefined
  })

  const createDailyWageMutation = useCreateDailyWage()
  const deleteDailyWageMutation = useDeleteDailyWage()

  useEffect(() => {
    if (employees && existingRecords) {
      const state: Record<string, PresenceRecord> = {}

      employees.forEach((emp: { id: string; name: string }) => {
        state[emp.id] = {
          employeeId: emp.id,
          employeeName: emp.name,
          presence: "NENHUM",
          isClosed: false
        }
      })

      existingRecords.forEach((rec: DailyWage) => {
        if (state[rec.employeeId]) {
          state[rec.employeeId].id = rec.id
          state[rec.employeeId].presence = rec.presence
          state[rec.employeeId].isClosed = rec.isClosed
        }
      })
      
      setRecords(state)
      setIsEditing(false)
    }
  }, [employees, existingRecords])

  const handleSave = async () => {
    const toSave: DailyWageFormData[] = []
    const toDelete: string[] = []

    Object.values(records).forEach(r => {
      // Save all explicitly set absences/presences
      if (r.presence !== "NENHUM") {
        toSave.push({
          employeeId: r.employeeId,
          frontId: frontId,
          seasonId: seasonId,
          date: new Date(date).toISOString(),
          presence: r.presence as AttendanceType,
          valueInCents: 0 // Absences, justified, medical certificates are 0 value. Presence value should be managed in the DailyWage tab
        })
      } else if (r.id) {
        // If it was previously saved but now is 'NENHUM', we should delete it
        toDelete.push(r.id)
      }
    })

    if (toSave.length === 0 && toDelete.length === 0) {
      toast.info("Nenhuma alteração definida para salvar.")
      return
    }

    try {
      if (toSave.length > 0) {
        await Promise.all(toSave.map(payload => createDailyWageMutation.mutateAsync(payload)))
      }
      if (toDelete.length > 0) {
        await Promise.all(toDelete.map(id => deleteDailyWageMutation.mutateAsync(id)))
      }
      
      toast.success("Presenças/Faltas salvas com sucesso!")
      setIsEditing(false)
      refetch()
    } catch {
      // Error is handled by global toast
    }
  }

  const handlePresenceChange = (empId: string, val: string) => {
    setIsEditing(true)
    setRecords(prev => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        presence: val as AttendanceType | "NENHUM"
      }
    }))
  }

  if (seasonId === "all" || frontId === "all" || !date) {
    return (
      <Card>
        <CardContent className="flex h-40 items-center justify-center text-muted-foreground p-6">
          Selecione a Safra, Frente de Trabalho e Data acima para gerenciar Presenças e Faltas.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg">Controle de Presença</CardTitle>
          <CardDescription>
            Marcação rápida de faltas e atestados. Se o funcionário recebeu diária normal, registre na aba Diárias.
          </CardDescription>
        </div>
        <Button onClick={handleSave} disabled={!isEditing || createDailyWageMutation.isPending}>
          <Save className="h-4 w-4" /> 
          {createDailyWageMutation.isPending ? "Salvando..." : "Salvar"}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoadingEmployees || isLoadingRecords ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Funcionário</TableHead>
                  <TableHead className="w-[250px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.values(records)
                  .sort((a, b) => a.employeeName.localeCompare(b.employeeName))
                  .map((rec) => (
                    <TableRow key={rec.employeeId}>
                      <TableCell className="font-medium">{rec.employeeName}</TableCell>
                      <TableCell>
                        <Select 
                          value={rec.presence} 
                          onValueChange={(val) => handlePresenceChange(rec.employeeId, val)}
                          disabled={rec.isClosed}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NENHUM">Não Registrado</SelectItem>
                            <SelectItem value="PRESENCA">Presença (Diária Normal)</SelectItem>
                            <SelectItem value="FALTA">Falta Injustificada</SelectItem>
                            <SelectItem value="FALTA_JUSTIFICADA">Falta Justificada</SelectItem>
                            <SelectItem value="ATESTADO">Atestado Médico</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                {Object.keys(records).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      Nenhum funcionário encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
