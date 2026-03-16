"use client"

import { useQuery } from "@tanstack/react-query"
import { Check, ChevronsUpDown, Plus, Trash } from "lucide-react"
import { useEffect, useRef, useState } from "react"
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
import { useCreateDriverAllocation } from "@/hooks/use-planting"
import { cn, formatCentsToReal, formatCurrency, parseCurrencyToCents } from "@/lib/utils"

interface DriverTabProps {
  seasonId: string
  frontId: string
  date: string
}

type DriverRecord = {
  id: string
  employeeId: string
  vehicleId?: string
  categoryId?: string
  vehicleNamePlate: string
  dailyValueInCents: number
  isClosed: boolean
}

export function DriverTab({ seasonId, frontId, date }: DriverTabProps) {
  const [allocations, setAllocations] = useState<DriverRecord[]>([])

  // Form State
  const [selectedDriverId, setSelectedDriverId] = useState<string>("")
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("")
  const [dailyValueFormatted, setDailyValueFormatted] = useState<string>("")

  // Typeahead state
  const [driverSearch, setDriverSearch] = useState<string>("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const typeaheadRef = useRef<HTMLDivElement>(null)

  // Fetch all active employees
  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await fetch("/api/employees")
      if (!res.ok) return []
      return res.json()
    }
  })

  // Fetch vehicles
  const { data: vehicles, isLoading: isLoadingVehicles } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const res = await fetch("/api/vehicles")
      if (!res.ok) return []
      return res.json() as Promise<{ id: string; plate: string; model: string | null }[]>
    }
  })

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
      setAllocations(existingRecords.map((r: { id: string; employeeId: string; vehicleId?: string; categoryId?: string; vehicle?: { plate: string; model: string }; valueInCents: number; isClosed: boolean }) => ({
        id: r.id,
        employeeId: r.employeeId,
        vehicleId: r.vehicleId,
        categoryId: r.categoryId,
        vehicleNamePlate: r.vehicle ? `${r.vehicle.plate}${r.vehicle.model ? ` - ${r.vehicle.model}` : ""}` : "N/A",
        dailyValueInCents: r.valueInCents,
        isClosed: r.isClosed
      })))
    }
  }, [existingRecords])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (typeaheadRef.current && !typeaheadRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const addDriverMutation = useCreateDriverAllocation()

  const handleRemove = (_id: string) => {
    toast.error("Remoção ainda não implementada no backend")
  }

  const handleAdd = () => {
    if (!selectedDriverId || !selectedVehicleId) {
      toast.error("Selecione motorista e frota.")
      return
    }

    const dailyValueInCents = dailyValueFormatted
      ? parseCurrencyToCents(dailyValueFormatted)
      : 0

    addDriverMutation.mutate(
      {
        employeeId: selectedDriverId,
        vehicleId: selectedVehicleId,
        frontId,
        seasonId,
        date: `${date}T12:00:00Z`, // Consistent UTC noon
        valueInCents: dailyValueInCents,
      },
      {
        onSuccess: () => {
          refetch()
          setSelectedDriverId("")
          setDriverSearch("")
          setSelectedVehicleId("")
          setDailyValueFormatted("")
        }
      }
    )
  }

  // Filtered employees for the typeahead
  const filteredEmployees = (employees || []).filter((emp: { id: string; name: string }) =>
    emp.name.toLowerCase().includes(driverSearch.toLowerCase())
  )

  const selectedEmployee = employees?.find((e: { id: string; name: string }) => e.id === selectedDriverId)

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
          <CardTitle className="text-lg">Motoristas e Frota</CardTitle>
          <CardDescription>
            Apontamento de motoristas vinculados a um veículo da frota.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-6 items-end flex-wrap">
          {/* Typeahead Driver Select */}
          <div className="flex-1 min-w-[200px] space-y-2" ref={typeaheadRef}>
            <Label>Motorista</Label>
            <div className="relative">
              <button
                type="button"
                className={cn(
                  "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background",
                  "placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring",
                  "cursor-pointer text-left"
                )}
                onClick={() => {
                  setIsDropdownOpen((prev) => !prev)
                  setDriverSearch("")
                }}
              >
                <span className={selectedEmployee ? "" : "text-muted-foreground"}>
                  {selectedEmployee ? selectedEmployee.name : "Selecione..."}
                </span>
                <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>

              {isDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                  <div className="p-2">
                    <Input
                      autoFocus
                      placeholder="Pesquisar motorista..."
                      value={driverSearch}
                      onChange={(e) => setDriverSearch(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <ul className="max-h-48 overflow-y-auto py-1">
                    {filteredEmployees.length === 0 ? (
                      <li className="px-3 py-2 text-sm text-muted-foreground">Nenhum resultado.</li>
                    ) : (
                      filteredEmployees.map((emp: { id: string; name: string }) => (
                        <li
                          key={emp.id}
                          className={cn(
                            "flex items-center gap-2 cursor-pointer px-3 py-2 text-sm hover:bg-muted",
                            selectedDriverId === emp.id && "bg-muted"
                          )}
                          onClick={() => {
                            setSelectedDriverId(emp.id)
                            setDriverSearch("")
                            setIsDropdownOpen(false)
                          }}
                        >
                          <Check className={cn("h-4 w-4", selectedDriverId === emp.id ? "opacity-100" : "opacity-0")} />
                          {emp.name}
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Vehicle / Fleet */}
          <div className="flex-1 min-w-[160px] space-y-2">
            <Label>Frota (Veículo)</Label>
            <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={isLoadingVehicles ? "Carregando..." : "Selecione..."} />
              </SelectTrigger>
              <SelectContent>
                {vehicles?.map((v: { id: string; plate: string; model: string | null }) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.plate} {v.model ? `- ${v.model}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Daily Value with currency formatting */}
          <div className="w-[150px] space-y-2">
            <Label>Valor Diária</Label>
            <Input
              type="text"
              placeholder="R$ 0,00"
              value={dailyValueFormatted}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, "")
                setDailyValueFormatted(formatCentsToReal(Number(raw)))
              }}
            />
          </div>

          <div className="flex items-end">
            <Button onClick={handleAdd} disabled={addDriverMutation.isPending}>
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Motorista</TableHead>
                <TableHead>Frota / Veículo</TableHead>
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
                  return (
                    <TableRow key={alloc.id} className={alloc.isClosed ? "opacity-60" : ""}>
                      <TableCell className="font-medium">{empObj?.name || "Desconhecido"}</TableCell>
                      <TableCell>{alloc.vehicleNamePlate}</TableCell>
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
