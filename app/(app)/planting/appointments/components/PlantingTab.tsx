"use client"

import { useQuery } from "@tanstack/react-query"
import { Save } from "lucide-react"
import { useEffect,useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription,CardHeader, CardTitle } from "@/components/ui/card"
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

  // Fetch all active employees
  const { data: employees, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await fetch("/api/employees")
      if (!res.ok) return []
      return res.json()
    }
  })

  // Fetch existing productions for the given date and front
  const { data: existingRecords, isLoading: isLoadingRecords, refetch } = useQuery({
    queryKey: ["plantingProductions", seasonId, frontId, date],
    queryFn: async () => {
      if (seasonId === "all" || frontId === "all" || !date) return []
      const res = await fetch(`/api/planting/productions?seasonId=${seasonId}&frontId=${frontId}&date=${date}T00:00:00Z`)
      if (!res.ok) throw new Error("Failed to fetch records")
      return res.json()
    },
    enabled: seasonId !== "all" && frontId !== "all" && !!date
  })

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
      existingRecords.forEach((rec: { id: string; employeeId: string; type: string; meters?: number; isClosed: boolean }) => {
        if (state[rec.employeeId]) {
          if (rec.type === "PLANTIO") {
            state[rec.employeeId].plantingMeters = rec.meters || 0
            state[rec.employeeId].id = rec.id // For simplification, keeping track of one ID per employee. Backend upserts.
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



  const handleSave = () => {
    // Collect non-zero entries
    const toSave: { employeeId: string; frontId: string; date: string; type: string; meters: number }[] = []
    Object.values(productions).forEach(p => {
      if (p.plantingMeters > 0) {
        toSave.push({
          employeeId: p.employeeId,
          frontId: frontId,
          date: new Date(date).toISOString(),
          type: "PLANTIO",
          meters: p.plantingMeters
        })
      }
      if (p.cuttingMeters > 0) {
        toSave.push({
          employeeId: p.employeeId,
          frontId: frontId,
          date: new Date(date).toISOString(),
          type: "CORTE",
          meters: p.cuttingMeters
        })
      }
    })

    // Wait, the backend productions POST expects a single object. 
    // We didn't build a batch save endpoint. Let's send them sequentially or we need to update the backend route.
    // For now, I will send them sequentially with Promise.all
    if (toSave.length === 0) {
      toast.info("Nenhum valor preenchido para salvar.")
      return
    }

    Promise.all(toSave.map(payload => 
      fetch("/api/planting/productions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).then(res => { if(!res.ok) throw new Error(); return res })
    )).then(() => {
      toast.success("Apontamentos salvos com sucesso!")
      setIsEditing(false)
      refetch()
    }).catch(() => {
      toast.error("Alguns apontamentos não puderam ser salvos. Verifique se o período está fechado.")
    })
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg">Plantio & Corte</CardTitle>
          <CardDescription>
            Informe a metragem de plantio ou corte realizada por cada funcionário nesta frente e data.
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
                <TableHead className="w-[150px] text-center">Plantio (m)</TableHead>
                <TableHead className="w-[150px] text-center">Corte (m)</TableHead>
                <TableHead className="w-[100px] text-right">Status</TableHead>
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
                  <TableCell colSpan={4} className="h-24 text-center">
                    Nenhum funcionário ativo encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                sortedEmployees.map((record) => (
                  <TableRow key={record.employeeId} className={record.isClosed ? "bg-muted/50" : ""}>
                    <TableCell className="font-medium">{record.employeeName}</TableCell>
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
