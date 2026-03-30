'use client'

import { FilterX, Loader2, Plus, Search } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"

import { VehicleFormDialog } from "@/components/fleet/vehicle-form-dialog"
import { VehiclesTable } from "@/components/fleet/vehicles-table"
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
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pagination } from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useCreateVehicle, useDeleteVehicle, useUpdateVehicle, useVehicles } from "@/hooks/use-vehicles"
import { Vehicle, VehicleFormData, VehicleType, VehicleTypeLabels } from "@/types/vehicle"

export default function FleetPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const page = Number(searchParams.get("page")) || 1
  const limit = Number(searchParams.get("limit")) || 10

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Filtros locais sincronizados com a URL
  const [plateFilter, setPlateFilter] = useState(searchParams.get("plate") || "")
  const [brandFilter, setBrandFilter] = useState(searchParams.get("brand") || "")
  const [yearFilter, setYearFilter] = useState(searchParams.get("year") || "")
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") || "TODOS")

  const hasActiveFilters = 
    plateFilter !== "" || 
    brandFilter !== "" || 
    yearFilter !== "" || 
    typeFilter !== "TODOS"

  const filters = useMemo(() => {
    const params: Record<string, string> = {
      page: String(page),
      limit: String(limit),
    }
    if (plateFilter) params.plate = plateFilter
    if (brandFilter) params.brand = brandFilter
    if (yearFilter) params.year = yearFilter
    if (typeFilter !== "TODOS") params.type = typeFilter
    return params
  }, [plateFilter, brandFilter, yearFilter, typeFilter, page, limit])

  const { data: response, isLoading } = useVehicles(filters)
  const createMutation = useCreateVehicle()
  const updateMutation = useUpdateVehicle()
  const deleteMutation = useDeleteVehicle()

  const updateFilters = (newFilters: Record<string, string | number | null | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "" || value === "TODOS") {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    })
    if (!newFilters.page && newFilters.page !== page) {
      params.delete("page")
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const clearFilters = () => {
    router.replace(pathname, { scroll: false })
    setPlateFilter("")
    setBrandFilter("")
    setYearFilter("")
    setTypeFilter("TODOS")
  }

  const handleCreate = (data: VehicleFormData) => {
    createMutation.mutate(data, {
      onSuccess: () => setIsFormOpen(false),
    })
  }

  const handleUpdate = (data: VehicleFormData) => {
    if (editingVehicle) {
      updateMutation.mutate({ id: editingVehicle.id, data }, {
        onSuccess: () => {
          setIsFormOpen(false)
          setEditingVehicle(null)
        }
      })
    }
  }

  const handleConfirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => setDeleteId(null)
      })
    }
  }

  const openCreate = () => {
    setEditingVehicle(null)
    setIsFormOpen(true)
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Frota</h2>
          <p className="text-muted-foreground">
            Gerencie veículos, manutenções e documentos da frota.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" /> Novo Veículo
        </Button>
      </div>

      <Card className="relative overflow-visible">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Placa</Label>
              <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
                <Input
                  placeholder="Filtrar por placa"
                  className="pl-8"
                  value={plateFilter}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase()
                    setPlateFilter(val)
                    updateFilters({ plate: val, page: 1 })
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Marca</Label>
              <Input
                placeholder="Ex: Volvo"
                value={brandFilter}
                onChange={(e) => {
                  setBrandFilter(e.target.value)
                  updateFilters({ brand: e.target.value, page: 1 })
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Ano</Label>
              <Input
                type="number"
                placeholder="Ex: 2023"
                value={yearFilter}
                onChange={(e) => {
                  setYearFilter(e.target.value)
                  updateFilters({ year: e.target.value, page: 1 })
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select 
                value={typeFilter} 
                onValueChange={(v) => {
                  setTypeFilter(v)
                  updateFilters({ type: v, page: 1 })
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  {Object.values(VehicleType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {VehicleTypeLabels[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>

        {hasActiveFilters && (
          <div className="absolute -top-4 left-1/2 z-10 -translate-x-1/2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={clearFilters}
                    className="h-8 w-8 rounded-full border bg-background shadow-xs hover:bg-accent"
                  >
                    <FilterX className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Limpar filtros</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </Card>

      {isLoading ? (
        <div className="flex justify-center items-center h-full w-full py-10">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          <VehiclesTable
            vehicles={response?.data || []}
            onEdit={(vehicle) => {
              setEditingVehicle(vehicle)
              setIsFormOpen(true)
            }}
            onDelete={setDeleteId}
          />
          {response?.meta && (
            <Pagination
              meta={response.meta}
              onPageChange={(p: number) => updateFilters({ page: p })}
              onLimitChange={(l: number) => updateFilters({ limit: l, page: 1 })}
            />
          )}
        </div>
      )}

      <VehicleFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        initialData={editingVehicle}
        onSubmit={editingVehicle ? handleUpdate : handleCreate}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Veículo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este veículo? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
