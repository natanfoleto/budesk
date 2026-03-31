import { MaintenanceFormData } from "@/components/fleet/maintenance-schema"
import { apiRequest } from "@/lib/api-client"
import { PaginatedResponse } from "@/types/api"
import { Maintenance, Vehicle, VehicleFormData } from "@/types/vehicle"

const BASE_URL = "/api"

// Vehicles CRUD

export const getVehicles = async (filters: Record<string, string> = {}): Promise<PaginatedResponse<Vehicle>> => {
  const params = new URLSearchParams(filters)
  return apiRequest<PaginatedResponse<Vehicle>>(`${BASE_URL}/vehicles?${params.toString()}`)
}

export const createVehicle = async (data: VehicleFormData) => {
  return apiRequest(`${BASE_URL}/vehicles`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export const getVehicle = async (id: string): Promise<Vehicle> => {
  return apiRequest<Vehicle>(`${BASE_URL}/vehicles/${id}`)
}

export const updateVehicle = async (id: string, data: Partial<VehicleFormData>) => {
  return apiRequest(`${BASE_URL}/vehicles/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export const deleteVehicle = async (id: string) => {
  return apiRequest(`${BASE_URL}/vehicles/${id}`, {
    method: "DELETE",
  })
}

// Maintenance Sub-resource

export const getMaintenances = async (vehicleId: string): Promise<Maintenance[]> => {
  return apiRequest<Maintenance[]>(`${BASE_URL}/vehicles/${vehicleId}/maintenances`)
}

export const createMaintenance = async (vehicleId: string, data: MaintenanceFormData) => {
  return apiRequest(`${BASE_URL}/vehicles/${vehicleId}/maintenances`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export const updateMaintenance = async (vehicleId: string, maintenanceId: string, data: Partial<MaintenanceFormData>) => {
  return apiRequest(`${BASE_URL}/vehicles/${vehicleId}/maintenances/${maintenanceId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export const deleteMaintenance = async (vehicleId: string, maintenanceId: string) => {
  return apiRequest(`${BASE_URL}/vehicles/${vehicleId}/maintenances/${maintenanceId}`, {
    method: "DELETE",
  })
}
