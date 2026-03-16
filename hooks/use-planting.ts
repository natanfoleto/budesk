import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  createDailyWage,
  createDriverAllocation,
  createExpense,
  createPlantingArea,
  createProduction,
  createSeason,
  createWorkFront,
  deleteDailyWage,
  deleteDriverAllocation,
  deleteExpense,
  deletePlantingArea,
  deleteProduction,
  deleteSeason,
  getDailyWages,
  getDashboard,
  getDriverAllocations,
  getExpenses,
  getParameters,
  getPlantingAreas,
  getProductions,
  getSeasons,
  getWorkFronts,
  saveParameters,
  updateSeason,
} from "@/lib/services/planting"
import {
  DailyWageFormData,
  DriverAllocationFormData,
  PlantingAreaFormData,
  PlantingExpenseFormData,
  SaveParametersPayload,
  SeasonFormData,
  WorkFrontFormData,
} from "@/types/planting"

// ─── Seasons ─────────────────────────────────────────────────────────────────

export const usePlantingSeasons = () => {
  return useQuery({
    queryKey: ["plantingSeasons"],
    queryFn: getSeasons,
  })
}

export const useCreateSeason = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createSeason,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plantingSeasons"] })
      toast.success("Safra criada com sucesso!")
    },
    onError: () => toast.error("Erro ao criar safra"),
  })
}

export const useUpdateSeason = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SeasonFormData> }) =>
      updateSeason(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plantingSeasons"] })
      toast.success("Safra atualizada!")
    },
    onError: () => toast.error("Erro ao atualizar safra"),
  })
}

export const useDeleteSeason = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteSeason,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plantingSeasons"] })
      toast.success("Safra removida com sucesso!")
    },
    onError: () => toast.error("Erro ao remover safra"),
  })
}

// ─── Work Fronts ─────────────────────────────────────────────────────────────

export const useWorkFronts = (seasonId?: string) => {
  return useQuery({
    queryKey: ["workFronts", seasonId],
    queryFn: () => getWorkFronts(seasonId),
    enabled: !!seasonId && seasonId !== "all",
  })
}

export const useCreateWorkFront = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: WorkFrontFormData & { seasonId: string }) => createWorkFront(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workFronts", variables.seasonId] })
      toast.success("Frente de trabalho criada!")
    },
    onError: () => toast.error("Erro ao criar frente de trabalho"),
  })
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const usePlantingDashboard = (seasonId?: string, filters?: { startDate?: string, endDate?: string }) => {
  return useQuery({
    queryKey: ["plantingDashboard", seasonId, filters?.startDate, filters?.endDate],
    queryFn: () => getDashboard(seasonId!, filters),
    enabled: !!seasonId,
  })
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export const usePlantingExpenses = (filters?: { seasonId?: string; frontId?: string; date?: string }) => {
  return useQuery({
    queryKey: ["plantingExpenses", filters?.seasonId, filters?.frontId, filters?.date],
    queryFn: () => getExpenses(filters),
  })
}

export const useCreateExpense = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: PlantingExpenseFormData) => createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plantingExpenses"] })
      queryClient.invalidateQueries({ queryKey: ["plantingDashboard"] })
      toast.success("Gasto registrado com sucesso.")
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export const useUpdateExpense = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PlantingExpenseFormData> }) => {
      const response = await fetch('/api/planting/expenses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...data }),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erro ao atualizar gasto')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plantingExpenses"] })
      queryClient.invalidateQueries({ queryKey: ["plantingDashboard"] })
      toast.success("Gasto atualizado com sucesso.")
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export const useDeleteExpense = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plantingExpenses"] })
      queryClient.invalidateQueries({ queryKey: ["plantingDashboard"] })
      toast.success("Registro removido.")
    },
    onError: () => toast.error("Erro ao remover gasto"),
  })
}

// ─── Parameters ───────────────────────────────────────────────────────────────

export const usePlantingParameters = () => {
  return useQuery({
    queryKey: ["plantingParameters"],
    queryFn: getParameters,
  })
}

export const useSaveParameters = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SaveParametersPayload) => saveParameters(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plantingParameters"] })
      toast.success("Parâmetros atualizados com sucesso")
    },
    onError: () => toast.error("Erro ao salvar parâmetros"),
  })
}

// ─── Productions ──────────────────────────────────────────────────────────────

export const usePlantingProductions = (filters?: { seasonId?: string; frontId?: string; date?: string }) => {
  return useQuery({
    queryKey: ["plantingProductions", filters?.seasonId, filters?.frontId, filters?.date],
    queryFn: () => getProductions(filters),
    enabled: !!filters?.seasonId && filters.seasonId !== "all",
  })
}

export const useCreateProduction = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createProduction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plantingProductions"] })
      queryClient.invalidateQueries({ queryKey: ["plantingDashboard"] })
      toast.success("Apontamento salvo!")
    },
    onError: (error: Error) => toast.error(error.message || "Erro ao salvar apontamento"),
  })
}

export const useDeleteProduction = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteProduction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plantingProductions"] })
      queryClient.invalidateQueries({ queryKey: ["plantingDashboard"] })
      toast.success("Apontamento removido.")
    },
    onError: () => toast.error("Erro ao remover apontamento"),
  })
}

// ─── Daily Wages ──────────────────────────────────────────────────────────────

export const useDailyWages = (filters?: { seasonId?: string; frontId?: string; date?: string }) => {
  return useQuery({
    queryKey: ["dailyWages", filters?.seasonId, filters?.frontId, filters?.date],
    queryFn: () => getDailyWages(filters),
    enabled: !!filters?.seasonId && filters.seasonId !== "all",
  })
}

export const useCreateDailyWage = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: DailyWageFormData) => createDailyWage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dailyWages"] })
      queryClient.invalidateQueries({ queryKey: ["plantingDashboard"] })
      toast.success("Diária salva!")
    },
    onError: (error: Error) => toast.error(error.message || "Erro ao salvar diária"),
  })
}

export const useDeleteDailyWage = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteDailyWage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dailyWages"] })
      queryClient.invalidateQueries({ queryKey: ["plantingDashboard"] })
      toast.success("Diária removida.")
    },
    onError: () => toast.error("Erro ao remover diária"),
  })
}

// ─── Driver Allocations ───────────────────────────────────────────────────────

export const useDriverAllocations = (filters?: { seasonId?: string; frontId?: string; date?: string }) => {
  return useQuery({
    queryKey: ["driverAllocations", filters?.seasonId, filters?.frontId, filters?.date],
    queryFn: () => getDriverAllocations(filters),
    enabled: !!filters?.seasonId && filters.seasonId !== "all",
  })
}

export const useCreateDriverAllocation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: DriverAllocationFormData) => createDriverAllocation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driverAllocations"] })
      queryClient.invalidateQueries({ queryKey: ["plantingDashboard"] })
      toast.success("Alocação salva!")
    },
    onError: (error: Error) => toast.error(error.message || "Erro ao salvar alocação"),
  })
}

export const useDeleteDriverAllocation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteDriverAllocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driverAllocations"] })
      queryClient.invalidateQueries({ queryKey: ["plantingDashboard"] })
      toast.success("Alocação removida.")
    },
    onError: () => toast.error("Erro ao remover alocação"),
  })
}

// ─── Planting Areas ───────────────────────────────────────────────────────────

export const usePlantingAreas = (filters?: { seasonId?: string; frontId?: string; date?: string }) => {
  return useQuery({
    queryKey: ["plantingAreas", filters?.seasonId, filters?.frontId, filters?.date],
    queryFn: () => getPlantingAreas(filters),
    enabled: !!filters?.seasonId && filters.seasonId !== "all",
  })
}

export const useCreatePlantingArea = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: PlantingAreaFormData) => createPlantingArea(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plantingAreas"] })
      queryClient.invalidateQueries({ queryKey: ["plantingDashboard"] })
      toast.success("Área registrada!")
    },
    onError: (error: Error) => toast.error(error.message || "Erro ao salvar área"),
  })
}

export const useDeletePlantingArea = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deletePlantingArea,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plantingAreas"] })
      queryClient.invalidateQueries({ queryKey: ["plantingDashboard"] })
      toast.success("Área removida.")
    },
    onError: () => toast.error("Erro ao remover área"),
  })
}
