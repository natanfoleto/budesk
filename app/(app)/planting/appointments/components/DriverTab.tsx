"use client"

import { useQuery } from "@tanstack/react-query"
import { Plus, Trash } from "lucide-react"
import { useEffect, useState } from "react"
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
import { useCreateDriverAllocation, useDriverCategories } from "@/hooks/use-planting"
import { formatCurrency } from "@/lib/utils"

interface DriverTabProps {
  seasonId: string
  frontId: string
  date: string
}

type DriverRecord = {
  id: string
  employeeId: string
  categoryId: string
  vehicleNamePlate: string
  dailyValueInCents: number
  isClosed: boolean
}

export function DriverTab({ seasonId, frontId, date }: DriverTabProps) {
  const [allocations, setAllocations] = useState<DriverRecord[]>([])
  
  // Form State
  const [selectedDriverId, setSelectedDriverId] = useState<string>("")
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")
  const [dailyValue, setDailyValue] = useState<number>(0)

  // Fetch all active employees
  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await fetch("/api/employees")
      if (!res.ok) return []
      return res.json()
    }
  })

  // Fetch driver categories via shared hook
  const { data: categories } = useDriverCategories()

  // Fetch existing driver allocations
  const { data: existingRecords, isLoading, refetch } = useQuery({
    queryKey: ["driverAllocations", seasonId, frontId, date],
    queryFn: async () => {
      if (seasonId === "all" || frontId === "all" || !date) return []
      const res = await fetch(`/api/planting/drivers?seasonId=${seasonId}&frontId=${frontId}&date=${date}T00:00:00Z`)
      if (!res.ok) throw new Error("Failed to fetch drivers")
      return res.json()
    },
    enabled: seasonId !== "all" && frontId !== "all" && !!date
  })

  useEffect(() => {
    if (existingRecords) {
      setAllocations(existingRecords.map((r: { id: string; employeeId: string; categoryId: string; vehicle?: { plate: string }; valueInCents: number; isClosed: boolean }) => ({
        id: r.id,
        employeeId: r.employeeId,
        categoryId: r.categoryId,
        vehicleNamePlate: r.vehicle?.plate || "N/A",
        dailyValueInCents: r.valueInCents,
        isClosed: r.isClosed
      })))
    }
  }, [existingRecords])

  const addDriverMutation = useCreateDriverAllocation()

  const handleRemove = (_id: string) => {
    toast.error("Remoção ainda não implementada no backend")
  }

  const handleAdd = () => {
    if (!selectedDriverId || !selectedCategoryId) {
      toast.error("Selecione motorista e categoria.")
      return
    }
    const cat = categories?.find((c: { id: string; defaultDailyValueInCents: number }) => c.id === selectedCategoryId)

    addDriverMutation.mutate(
      {
        employeeId: selectedDriverId,
        categoryId: selectedCategoryId,
        frontId,
        seasonId,
        date: new Date(date).toISOString(),
        valueInCents: dailyValue > 0 ? Math.round(dailyValue * 100) : cat?.defaultDailyValueInCents || 0,
      },
      {
        onSuccess: () => {
          refetch()
          setSelectedDriverId("")
          setSelectedCategoryId("")
        }
      }
    )
  }

  // Auto-fill value when category changes
  useEffect(() => {
    if (selectedCategoryId && categories) {
      const cat = categories.find((c: { id: string; defaultDailyValueInCents: number }) => c.id === selectedCategoryId)
      if (cat) setDailyValue(cat.defaultDailyValueInCents / 100)
    }
  }, [selectedCategoryId, categories])

  if (seasonId === "all" || frontId === "all" || !date) {
    return (
      <Card>
        <CardContent className="flex h-40 items-center justify-center text-muted-foreground p-6">
          Selecione a Safra, Frente de Trabalho e Data acima para gerenciar Motoristas.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg">Motoristas e Veículos</CardTitle>
          <CardDescription>
            Apontamento de motoristas (Tratorista, Motorista Caminhão, Lotação, etc).
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <Label>Motorista</Label>
            <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {employees?.map((emp: { id: string; name: string }) => (
                  <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label>Categoria</Label>
            <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((cat: { id: string; name: string }) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-[150px]">
            <Label>Valor Diária</Label>
            <Input 
              type="number" 
              step="0.01"
              value={dailyValue || ""} 
              onChange={(e) => setDailyValue(Number(e.target.value))} 
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleAdd} disabled={addDriverMutation.isPending}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Motorista</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4}><Skeleton className="h-6 w-full" /></TableCell>
                </TableRow>
              ) : allocations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Nenhum motorista alocado nesta data.
                  </TableCell>
                </TableRow>
              ) : (
                allocations.map((alloc) => {
                  const empObj = employees?.find((e: { id: string; name: string }) => e.id === alloc.employeeId)
                  const catObj = categories?.find((c: { id: string; name: string }) => c.id === alloc.categoryId)
                  return (
                    <TableRow key={alloc.id} className={alloc.isClosed ? "opacity-60" : ""}>
                      <TableCell className="font-medium">{empObj?.name || "Desconhecido"}</TableCell>
                      <TableCell>{catObj?.name || "-"}</TableCell>
                      <TableCell className="text-right">{formatCurrency(alloc.dailyValueInCents)}</TableCell>
                      <TableCell className="text-right">
                        {!alloc.isClosed && (
                          <Button variant="ghost" size="icon" onClick={() => handleRemove(alloc.id)}>
                            <Trash className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
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
  )
}
