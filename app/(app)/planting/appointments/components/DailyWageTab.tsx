"use client"

import { useQuery } from "@tanstack/react-query"
import { Save } from "lucide-react"
import { useEffect,useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription,CardHeader, CardTitle } from "@/components/ui/card"
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

interface DailyWageTabProps {
  seasonId: string
  frontId: string
  date: string
}

type WageRecord = {
  id?: string
  employeeId: string
  employeeName: string
  presence: boolean
  dailyValueInCents: number
  isClosed: boolean
}

export function DailyWageTab({ seasonId, frontId, date }: DailyWageTabProps) {
  const [wages, setWages] = useState<Record<string, WageRecord>>({})
  const [isEditing, setIsEditing] = useState(false)

  // Fetch all active employees
  const { data: employees, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await fetch("/api/employees")
      if (!res.ok) return []
      return res.json()
    }
  })

  // Fetch existing daily wages for the given date and front
  const { data: existingRecords, isLoading: isLoadingRecords, refetch } = useQuery({
    queryKey: ["dailyWages", seasonId, frontId, date],
    queryFn: async () => {
      if (seasonId === "all" || frontId === "all" || !date) return []
      const res = await fetch(`/api/planting/daily-wages?seasonId=${seasonId}&frontId=${frontId}&date=${date}T00:00:00Z`)
      if (!res.ok) throw new Error("Failed to fetch wages")
      return res.json()
    },
    enabled: seasonId !== "all" && frontId !== "all" && !!date
  })

  // Fetch standard values for default daily wage
  const { data: parameters } = useQuery({
    queryKey: ["plantingParameters"],
    queryFn: async () => {
      const res = await fetch("/api/planting/parameters")
      return res.json()
    }
  })

  useEffect(() => {
    if (employees && existingRecords && parameters) {
      const state: Record<string, WageRecord> = {}
      
      const defaultWageParam = parameters?.find((p: { key: string; valueInCents: number }) => p.key === "valor_diaria")
      const defaultWageInCents = defaultWageParam ? defaultWageParam.valueInCents : 9000 // default 90 BRL

      employees.forEach((emp: { id: string; name: string }) => {
        state[emp.id] = {
          employeeId: emp.id,
          employeeName: emp.name,
          presence: false,
          dailyValueInCents: defaultWageInCents,
          isClosed: false
        }
      })

      existingRecords.forEach((rec: { id: string; employeeId: string; presence: boolean; dailyValueInCents: number; isClosed: boolean }) => {
        if (state[rec.employeeId]) {
          state[rec.employeeId].id = rec.id
          state[rec.employeeId].presence = rec.presence
          state[rec.employeeId].dailyValueInCents = rec.dailyValueInCents
          state[rec.employeeId].isClosed = rec.isClosed
        }
      })
      
      setWages(state)
      setIsEditing(false)
    }
  }, [employees, existingRecords, parameters])

  const handleSave = () => {
    const toSave: { employeeId: string; frontId: string; date: string; presence: boolean; dailyValueInCents: number }[] = []
    Object.values(wages).forEach(w => {
      if (w.presence) {
        toSave.push({
          employeeId: w.employeeId,
          frontId: frontId,
          date: new Date(date).toISOString(),
          presence: w.presence,
          dailyValueInCents: w.dailyValueInCents
        })
      }
    })

    if (toSave.length === 0) {
      toast.info("Nenhuma diária marcada.")
      return
    }

    Promise.all(toSave.map(payload => 
      fetch("/api/planting/daily-wages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).then(res => { if(!res.ok) throw new Error(); return res })
    )).then(() => {
      toast.success("Diárias salvas com sucesso!")
      setIsEditing(false)
      refetch()
    }).catch(() => {
      toast.error("Erro ao salvar diárias.")
    })
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

  const sortedEmployees = Object.values(wages).sort((a, b) => a.employeeName.localeCompare(b.employeeName))

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg">Diárias</CardTitle>
          <CardDescription>
            Apontamento de diaristas na frente de trabalho para a data selecionada.
          </CardDescription>
        </div>
        <Button onClick={handleSave} disabled={!isEditing}>
          <Save className="mr-2 h-4 w-4" /> Salvar Alterações
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
                <TableHead className="w-[100px] text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingEmployees || isLoadingRecords ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-10 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                ))
              ) : sortedEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Nenhum funcionário encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                sortedEmployees.map((record) => (
                  <TableRow key={record.employeeId} className={record.isClosed ? "bg-muted/50" : ""}>
                    <TableCell className="font-medium">{record.employeeName}</TableCell>
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
                    <TableCell className="text-right">
                      {record.isClosed ? (
                        <span className="text-xs text-muted-foreground">Fechado</span>
                      ) : (
                        <span className="text-xs text-green-600">Aberto</span>
                      )}
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
