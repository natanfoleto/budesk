import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { MaintenanceFormData } from "@/components/fleet/maintenance-schema"
import {
  createMaintenance,
  createVehicle,
  deleteMaintenance,
  deleteVehicle,
  getMaintenances,
  getVehicle,
  getVehicles,
  updateMaintenance,
  updateVehicle,
} from "@/lib/services/vehicles"
import { VehicleFormData } from "@/types/vehicle"

export const useVehicles = (filters?: Record<string, string>) => {
  return useQuery({
    queryKey: ["vehicles", filters],
    queryFn: () => getVehicles(filters || {}),
  })
}

export const useVehicle = (id: string) => {
  return useQuery({
    queryKey: ["vehicle", id],
    queryFn: () => getVehicle(id),
    enabled: !!id,
  })
}

export const useCreateVehicle = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] })
      toast.success("Veículo cadastrado com sucesso!")
    },
    onError: (error: Error) => toast.error(error.message || "Erro ao cadastrar veículo"),
  })
}

export const useUpdateVehicle = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VehicleFormData> }) => 
      updateVehicle(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] })
      queryClient.invalidateQueries({ queryKey: ["vehicle", variables.id] })
      toast.success("Veículo atualizado com sucesso!")
    },
    onError: (error: Error) => toast.error(error.message || "Erro ao atualizar veículo"),
  })
}

export const useDeleteVehicle = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] })
      toast.success("Veículo excluído com sucesso!")
    },
    onError: (error: Error) => toast.error(error.message || "Erro ao excluir veículo"),
  })
}

// Maintenance Hooks

export const useVehicleMaintenances = (vehicleId: string) => {
  return useQuery({
    queryKey: ["maintenances", vehicleId],
    queryFn: () => getMaintenances(vehicleId),
    enabled: !!vehicleId,
  })
}

export const useCreateMaintenance = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ vehicleId, data }: { vehicleId: string; data: MaintenanceFormData }) => 
      createMaintenance(vehicleId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["maintenances", variables.vehicleId] })
      toast.success("Manutenção registrada!")
    },
    onError: (error: Error) => toast.error(error.message || "Erro ao registrar manutenção"),
  })
}

export const useUpdateMaintenance = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ vehicleId, maintenanceId, data }: { vehicleId: string; maintenanceId: string; data: Partial<MaintenanceFormData> }) => 
      updateMaintenance(vehicleId, maintenanceId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["maintenances", variables.vehicleId] })
      toast.success("Manutenção atualizada!")
    },
    onError: (error: Error) => toast.error(error.message || "Erro ao atualizar manutenção"),
  })
}

export const useDeleteMaintenance = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ vehicleId, maintenanceId }: { vehicleId: string; maintenanceId: string }) => 
      deleteMaintenance(vehicleId, maintenanceId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["maintenances", variables.vehicleId] })
      toast.success("Manutenção excluída!")
    },
    onError: (error: Error) => toast.error(error.message || "Erro ao excluir manutenção"),
  })
}
