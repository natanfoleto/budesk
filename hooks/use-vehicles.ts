import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  createVehicle,
  deleteVehicle,
  getVehicles,
  updateVehicle,
} from "@/lib/services/vehicles"
import { VehicleFormData } from "@/types/vehicle"

export const useVehicles = (filters?: Record<string, string>) => {
  return useQuery({
    queryKey: ["vehicles", filters],
    queryFn: () => getVehicles(filters || {}),
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] })
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
