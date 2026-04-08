"use client"

import { useQuery } from "@tanstack/react-query"
import { Check, ChevronsUpDown, DollarSign, MoreHorizontal, Plus } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useEmployees } from "@/hooks/use-employees"
import { useCreateDriverAllocation } from "@/hooks/use-planting"
import { useVehicles } from "@/hooks/use-vehicles"
import { apiRequest } from "@/lib/api-client"
import { cn, formatCentsToReal, formatCurrency, parseCurrencyToCents } from "@/lib/utils"
import { isBeforeAdmission, isEmployeeActiveAtDate } from "@/lib/utils/planting-utils"
import { EmployeeDetailsModal } from "@/src/modules/planting/components/EmployeeDetailsModal"
import { PaymentAssistantModal } from "@/src/modules/planting/components/PaymentAssistantModal"

interface DriverTabProps {
  seasonId: string
  frontId: string
  date: string
  selectedTagIds?: string[]
}

type DriverRecord = {
  id: string
  employeeId: string
  vehicleId?: string
  categoryId?: string
  vehicleNamePlate: string
  vehicleColor?: string | null
  dailyValueInCents: number
  isClosed: boolean
}

export function DriverTab({ seasonId, frontId, date, selectedTagIds = [] }: DriverTabProps) {
  const [allocations, setAllocations] = useState<DriverRecord[]>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)

  // Add form state
  const [selectedDriverId, setSelectedDriverId] = useState<string>("")
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("")
  const [dailyValueFormatted, setDailyValueFormatted] = useState<string>("")

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValueFormatted, setEditValueFormatted] = useState<string>("")
  const [editVehicleId, setEditVehicleId] = useState<string>("")
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  // Typeahead state
  const [driverSearch, setDriverSearch] = useState<string>("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const typeaheadRef = useRef<HTMLDivElement>(null)

  const { data: employees } = useEmployees({ tagIds: selectedTagIds })
  const { data: vehicles, isLoading: isLoadingVehicles } = useVehicles({ active: "true", limit: "100" })

  const { data: existingRecords, isLoading, refetch } = useQuery({
    queryKey: ["driverAllocations", seasonId, frontId, date, selectedTagIds],
    queryFn: () => {
      const params = new URLSearchParams({ seasonId, frontId, date: `${date}T00:00:00Z` })
      if (selectedTagIds.length > 0) {
        selectedTagIds.forEach(id => params.append("tagIds", id))
      }
      return apiRequest<{
        id: string;
        employeeId: string;
        vehicleId?: string;
        categoryId?: string;
        vehicle?: { plate: string; model: string; color: string | null };
        valueInCents: number;
        isClosed: boolean
      }[]>(`/api/planting/drivers?${params.toString()}`)
    },
    enabled: seasonId !== "all" && frontId !== "all" && !!date
  })

  useEffect(() => {
    if (existingRecords) {
      setAllocations(existingRecords.map((r) => ({
        id: r.id,
        employeeId: r.employeeId,
        vehicleId: r.vehicleId,
        categoryId: r.categoryId,
        vehicleNamePlate: r.vehicle ? `${r.vehicle.plate}${r.vehicle.model ? ` - ${r.vehicle.model}` : ""}` : "N/A",
        vehicleColor: r.vehicle?.color,
        dailyValueInCents: r.valueInCents,
        isClosed: r.isClosed
      })))
    }
  }, [existingRecords])

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

  const handleRemove = async (id: string) => {
    try {
      await fetch(`/api/planting/drivers?id=${id}`, { method: "DELETE" })
      refetch()
      toast.success("Alocação removida.")
    } catch {
      toast.error("Erro ao remover alocação.")
    }
  }

  const handleStartEdit = (alloc: DriverRecord) => {
    setEditingId(alloc.id)
    setEditValueFormatted(formatCentsToReal(alloc.dailyValueInCents))
    setEditVehicleId(alloc.vehicleId || "")
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditValueFormatted("")
    setEditVehicleId("")
  }

  const handleSaveEdit = async (alloc: DriverRecord) => {
    setIsSavingEdit(true)
    try {
      const valueInCents = editValueFormatted ? parseCurrencyToCents(editValueFormatted) : 0
      await apiRequest(`/api/planting/drivers`, {
        method: "POST",
        body: JSON.stringify({
          id: alloc.id,
          employeeId: alloc.employeeId,
          vehicleId: editVehicleId || undefined,
          frontId,
          seasonId,
          date: `${date}T12:00:00Z`,
          valueInCents,
        }),
      })
      refetch()
      setEditingId(null)
      toast.success("Alocação atualizada.")
    } catch {
      toast.error("Erro ao atualizar alocação.")
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleAdd = () => {
    if (!selectedDriverId) {
      toast.error("Selecione um motorista.")
      return
    }

    const dailyValueInCents = dailyValueFormatted
      ? parseCurrencyToCents(dailyValueFormatted)
      : 0

    addDriverMutation.mutate(
      {
        employeeId: selectedDriverId,
        vehicleId: selectedVehicleId || undefined,
        frontId,
        seasonId,
        date: `${date}T12:00:00Z`,
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

  const employeeList = employees?.data || []
  const filteredEmployees = (employeeList || []).filter((emp: { id: string; name: string }) =>
    emp.name.toLowerCase().includes(driverSearch.toLowerCase())
  )

  const selectedEmployee = employees?.data?.find((e: { id: string; name: string }) => e.id === selectedDriverId)

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
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg">Motoristas e Frota</CardTitle>
            <CardDescription>
              Apontamento de motoristas. A vinculação a um veículo da frota é opcional.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {/* Add form */}
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

            {/* Vehicle / Fleet - Optional */}
            <div className="flex-1 min-w-[160px] space-y-2">
              <Label>Frota (Opcional)</Label>
              <Select value={selectedVehicleId || "none"} onValueChange={(v) => setSelectedVehicleId(v === "none" ? "" : v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={isLoadingVehicles ? "Carregando..." : "Sem frota"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem frota</SelectItem>
                  {vehicles?.data?.map((v: { id: string; plate: string; model: string | null; color?: string | null }) => (
                    <SelectItem key={v.id} value={v.id}>
                      <div className="flex items-center gap-2">
                        {v.color && (
                          <div 
                            className="w-2.5 h-2.5 rounded-full border border-muted-foreground/20" 
                            style={{ backgroundColor: v.color }} 
                          />
                        )}
                        {v.plate} {v.model ? `- ${v.model}` : ""}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Daily Value */}
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

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Motorista</TableHead>
                  <TableHead>Frota / Veículo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-[80px] text-right">Ações</TableHead>
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
                    const empObj = employees?.data?.find((e: { id: string; name: string }) => e.id === alloc.employeeId)
                    const isEditing = editingId === alloc.id

                    return (
                      <TableRow
                        key={alloc.id}
                        className={cn(alloc.isClosed ? "opacity-60" : "", "hover:bg-muted/50 transition-colors")}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2 group">
                            <span
                              className="cursor-pointer hover:underline underline-offset-4 decoration-primary/50 transition-all"
                              onClick={() => {
                                setSelectedEmployeeId(alloc.employeeId)
                                setIsModalOpen(true)
                              }}
                            >
                              {empObj?.name || "Desconhecido"}
                            </span>
                            <button
                              onClick={() => {
                                setSelectedEmployeeId(alloc.employeeId)
                                setIsAssistantOpen(true)
                              }}
                              className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                              title="Abrir Assistente de Pagamentos"
                            >
                              <DollarSign className="size-3" />
                            </button>
                          </div>
                          {empObj && (
                            <div className="flex gap-1 mt-0.5">
                              {(() => {
                                const isTerminated = !isEmployeeActiveAtDate(date, empObj.terminationDate)
                                const isPreAdmission = isBeforeAdmission(date, empObj.admissionDate)
                                
                                return (
                                  <>
                                    {isTerminated && empObj.terminationDate && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="bg-muted text-muted-foreground text-[9px] font-black px-1 py-0.5 rounded border border-border shadow-sm whitespace-nowrap cursor-help uppercase">
                                              ENCERRADO
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            Contrato encerrado em {new Date(new Date(empObj.terminationDate).toISOString().split('T')[0] + "T12:00:00").toLocaleDateString("pt-BR")}
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                    {isPreAdmission && empObj.admissionDate && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="bg-pink-100 text-pink-700 text-[9px] font-black px-1 py-0.5 rounded border border-pink-200 shadow-sm whitespace-nowrap cursor-help uppercase">
                                              PRÉ-ADMISSÃO
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            Admissão em {new Date(new Date(empObj.admissionDate).toISOString().split('T')[0] + "T12:00:00").toLocaleDateString("pt-BR")}
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                  </>
                                )
                              })()}
                            </div>
                          )}
                        </TableCell>

                        {/* Vehicle cell - editable */}
                        <TableCell>
                          {isEditing ? (
                            <Select
                              value={editVehicleId || "none"}
                              onValueChange={(v) => setEditVehicleId(v === "none" ? "" : v)}
                            >
                              <SelectTrigger className="h-8 w-full min-w-[160px]">
                                <SelectValue placeholder="Sem frota" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Sem frota</SelectItem>
                                {vehicles?.data?.map((v: { id: string; plate: string; model: string | null }) => (
                                  <SelectItem key={v.id} value={v.id}>
                                    {v.plate} {v.model ? `- ${v.model}` : ""}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="flex items-center gap-2">
                              {alloc.vehicleColor && (
                                <div 
                                  className="w-2.5 h-2.5 rounded-full border border-muted-foreground/20" 
                                  style={{ backgroundColor: alloc.vehicleColor }} 
                                />
                              )}
                              {alloc.vehicleNamePlate !== "N/A"
                                ? alloc.vehicleNamePlate
                                : <span className="text-muted-foreground text-xs">Sem Frota</span>
                              }
                            </div>
                          )}
                        </TableCell>

                        {/* Value cell - editable */}
                        <TableCell className="text-right">
                          {isEditing ? (
                            <Input
                              className="h-8 w-[130px] ml-auto text-right"
                              value={editValueFormatted}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/\D/g, "")
                                setEditValueFormatted(formatCentsToReal(Number(raw)))
                              }}
                            />
                          ) : (
                            formatCurrency(alloc.dailyValueInCents)
                          )}
                        </TableCell>

                        {/* Actions cell */}
                        <TableCell className="text-right">
                          {!alloc.isClosed && (
                            isEditing ? (
                              <div className="flex justify-end gap-0.5">
                                <Button
                                  variant="link"
                                  className="text-xs px-1"
                                  disabled={isSavingEdit}
                                  onClick={() => handleSaveEdit(alloc)}
                                >
                                  Salvar
                                </Button>
                                <Button
                                  variant="link"
                                  className="text-xs px-1"
                                  onClick={handleCancelEdit}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            ) : (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Ações</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    className="cursor-pointer"
                                    onClick={() => handleStartEdit(alloc)}
                                  >
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="cursor-pointer text-destructive focus:text-destructive"
                                    onClick={() => handleRemove(alloc.id)}
                                  >
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )
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
      <EmployeeDetailsModal
        employeeId={selectedEmployeeId}
        seasonId={seasonId}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onNavigate={(target) => {
          if (target === "assistant") {
            setIsModalOpen(false)
            setIsAssistantOpen(true)
          }
        }}
      />
      <PaymentAssistantModal
        employeeId={selectedEmployeeId}
        seasonId={seasonId}
        open={isAssistantOpen}
        onOpenChange={setIsAssistantOpen}
        onNavigate={(target) => {
          if (target === "details") {
            setIsAssistantOpen(false)
            setIsModalOpen(true)
          }
        }}
      />
    </>
  )
}
