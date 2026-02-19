"use client"

import { Loader2, Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

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
import { Input } from "@/components/ui/input"
import { Vehicle } from "@/types/vehicle"

export default function FleetPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const fetchVehicles = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/vehicles")
      if (response.ok) {
        const data: Vehicle[] = await response.json()
        setVehicles(data)
      }
    } catch (error) {
      console.error("Erro ao buscar veículos:", error)
      toast.error("Erro ao carregar veículos")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchVehicles()
  }, [])

  const handleCreate = () => {

    setIsFormOpen(true)
  }

  const handleSuccess = () => {
    fetchVehicles()
  }

  const handleDeleteClick = (id: string) => {
    setDeleteId(id)
  }

  const handleConfirmDelete = async () => {
    if (!deleteId) return

    try {
      const response = await fetch(`/api/vehicles/${deleteId}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erro ao excluir veículo")
      }

      toast.success("Veículo excluído com sucesso")
      fetchVehicles()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Erro desconhecido")
    } finally {
      setDeleteId(null)
    }
  }

  const filteredVehicles = vehicles.filter((vehicle) =>
    vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Frota</h1>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          Novo Veículo
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Filtrar por placa..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-full w-full py-10">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <VehiclesTable
          vehicles={filteredVehicles}

          onDelete={handleDeleteClick}
        />
      )}

      <VehicleFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        initialData={null}
        onSuccess={handleSuccess}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Veículo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este veículo? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-500 hover:bg-red-600">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
