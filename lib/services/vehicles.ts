import { MaintenanceFormData } from "@/components/fleet/maintenance-schema"
import { Vehicle, VehicleFormData } from "@/types/vehicle"

const BASE_URL = "/api"

// Vehicles CRUD

export const getVehicles = async (): Promise<Vehicle[]> => {
  const res = await fetch(`${BASE_URL}/vehicles`)
  if (!res.ok) throw new Error("Erro ao buscar veículos")
  return res.json()
}

export const createVehicle = async (data: VehicleFormData) => {
  const res = await fetch(`${BASE_URL}/vehicles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Erro ao criar veículo")
  }
  return res.json()
}

export const getVehicle = async (id: string): Promise<Vehicle> => {
  const res = await fetch(`${BASE_URL}/vehicles/${id}`)
  if (!res.ok) throw new Error("Erro ao buscar veículo")
  return res.json()
}

export const updateVehicle = async (id: string, data: Partial<VehicleFormData>) => {
  const res = await fetch(`${BASE_URL}/vehicles/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Erro ao atualizar veículo")
  }
  return res.json()
}

export const deleteVehicle = async (id: string) => {
  const res = await fetch(`${BASE_URL}/vehicles/${id}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Erro ao excluir veículo")
  return res.json()
}

// Maintenance Sub-resource

export const getMaintenances = async (vehicleId: string) => {
  const res = await fetch(`${BASE_URL}/vehicles/${vehicleId}/maintenances`)
  if (!res.ok) throw new Error("Erro ao buscar manutenções")
  return res.json()
}

export const createMaintenance = async (vehicleId: string, data: MaintenanceFormData) => {
  const res = await fetch(`${BASE_URL}/vehicles/${vehicleId}/maintenances`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Erro ao criar manutenção")
  }
  return res.json()
}

export const updateMaintenance = async (vehicleId: string, maintenanceId: string, data: Partial<MaintenanceFormData>) => {
  const res = await fetch(`${BASE_URL}/vehicles/${vehicleId}/maintenances/${maintenanceId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Erro ao atualizar manutenção")
  }
  return res.json()
}

export const deleteMaintenance = async (vehicleId: string, maintenanceId: string) => {
  const res = await fetch(`${BASE_URL}/vehicles/${vehicleId}/maintenances/${maintenanceId}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Erro ao excluir manutenção")
  return res.json()
}
