"use client"

import { Plus } from "lucide-react"
import { useEffect, useState } from "react"

import { VehicleFormDialog } from "@/components/fleet/vehicle-form-dialog"
import { VehiclesTable } from "@/components/fleet/vehicles-table"
import { Button } from "@/components/ui/button"
import { Vehicle } from "@/types/vehicle"

export default function FleetPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)

  const fetchVehicles = async () => {
    try {
      const response = await fetch("/api/vehicles")
      if (response.ok) {
        const data = await response.json()
        setVehicles(data)
      }
    } catch (error) {
      console.error("Erro ao buscar veículos:", error)
    }
  }

  useEffect(() => {
    fetchVehicles()
  }, [])

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setIsFormOpen(true)
  }

  const handleCreate = () => {
    setEditingVehicle(null)
    setIsFormOpen(true)
  }

  const handleSuccess = () => {
    fetchVehicles()
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Frota</h1>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Veículo
        </Button>
      </div>

      <VehiclesTable 
        data={vehicles} 
        onEdit={handleEdit} 
        onRefresh={fetchVehicles} 
      />

      <VehicleFormDialog 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        initialData={editingVehicle}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
