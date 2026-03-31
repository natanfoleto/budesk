import { apiRequest } from "@/lib/api-client"
import { PaginatedResponse } from "@/types/api"
import {
  DailyWage,
  DailyWageFormData,
  DriverAllocation,
  DriverAllocationFormData,
  PlantingAdvance,
  PlantingArea,
  PlantingAreaFormData,
  PlantingDashboardChartData,
  PlantingDashboardMetrics,
  PlantingExpense,
  PlantingExpenseFormData,
  PlantingParameter,
  PlantingProduction,
  PlantingProductionFormData,
  PlantingSeason,
  SaveParametersPayload,
  SeasonFormData,
  WorkFront,
  WorkFrontFormData,
} from "@/types/planting"

const BASE_URL = "/api"

// ─── Seasons ─────────────────────────────────────────────────────────────────

export const getSeasons = async (): Promise<PlantingSeason[]> => {
  return apiRequest<PlantingSeason[]>(`${BASE_URL}/planting/seasons`)
}

export const createSeason = async (data: SeasonFormData): Promise<PlantingSeason> => {
  return apiRequest<PlantingSeason>(`${BASE_URL}/planting/seasons`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export const updateSeason = async (id: string, data: Partial<SeasonFormData>): Promise<PlantingSeason> => {
  return apiRequest<PlantingSeason>(`${BASE_URL}/planting/seasons/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export const deleteSeason = async (id: string): Promise<void> => {
  return apiRequest(`${BASE_URL}/planting/seasons/${id}`, {
    method: "DELETE",
  })
}

// ─── Work Fronts ────────────────────────────────────────────────────────────

export const getWorkFronts = async (seasonId?: string): Promise<WorkFront[]> => {
  const url = seasonId
    ? `${BASE_URL}/planting/work-fronts?seasonId=${seasonId}`
    : `${BASE_URL}/planting/work-fronts`
  return apiRequest<WorkFront[]>(url)
}

export const createWorkFront = async (data: WorkFrontFormData & { seasonId: string }): Promise<WorkFront> => {
  return apiRequest<WorkFront>(`${BASE_URL}/planting/work-fronts`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

// ─── Expenses ────────────────────────────────────────────────────────────────

export const getExpenses = async (filters?: { 
  seasonId?: string; 
  frontId?: string; 
  date?: string;
  startDate?: string;
  endDate?: string;
  supplierId?: string;
  category?: string;
  vehicleId?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<PlantingExpense>> => {
  const params = new URLSearchParams()
  if (filters?.seasonId && filters.seasonId !== "all") params.set("seasonId", filters.seasonId)
  if (filters?.frontId && filters.frontId !== "all") params.set("frontId", filters.frontId)
  if (filters?.date) params.set("date", filters.date)
  if (filters?.startDate) params.set("startDate", filters.startDate)
  if (filters?.endDate) params.set("endDate", filters.endDate)
  if (filters?.supplierId) params.set("supplierId", filters.supplierId)
  if (filters?.category) params.set("category", filters.category)
  if (filters?.vehicleId) params.set("vehicleId", filters.vehicleId)
  if (filters?.page) params.set("page", String(filters.page))
  if (filters?.limit) params.set("limit", String(filters.limit))

  const url = `${BASE_URL}/planting/expenses?${params.toString()}`
  return apiRequest<PaginatedResponse<PlantingExpense>>(url)
}

export const createExpense = async (data: PlantingExpenseFormData): Promise<PlantingExpense> => {
  return apiRequest<PlantingExpense>(`${BASE_URL}/planting/expenses`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export const deleteExpense = async (id: string): Promise<void> => {
  return apiRequest(`${BASE_URL}/planting/expenses?id=${id}`, {
    method: "DELETE",
  })
}

// ─── Parameters ──────────────────────────────────────────────────────────────

export const getParameters = async (): Promise<PlantingParameter[]> => {
  return apiRequest<PlantingParameter[]>(`${BASE_URL}/planting/parameters`)
}

export const saveParameters = async (data: SaveParametersPayload): Promise<PlantingParameter[]> => {
  return apiRequest<PlantingParameter[]>(`${BASE_URL}/planting/parameters`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const getDashboard = async (
  seasonId: string, 
  filters?: { startDate?: string; endDate?: string; mode?: "overview" | "periods" | "charts"; date?: string; days?: number }
): Promise<PlantingDashboardMetrics | { today: PlantingDashboardMetrics; fortnight: PlantingDashboardMetrics; month: PlantingDashboardMetrics; general: PlantingDashboardMetrics } | PlantingDashboardChartData[]> => {
  const params = new URLSearchParams({ seasonId })
  if (filters?.startDate) params.set("startDate", filters.startDate)
  if (filters?.endDate) params.set("endDate", filters.endDate)
  if (filters?.mode) params.set("mode", filters.mode)
  if (filters?.date) params.set("date", filters.date)
  if (filters?.days) params.set("days", filters.days.toString())
  
  return apiRequest(`${BASE_URL}/planting/dashboard?${params.toString()}`)
}

// ─── Productions ─────────────────────────────────────────────────────────────

export const getProductions = async (filters?: { seasonId?: string; frontId?: string; date?: string; tagIds?: string[] }) => {
  const params = new URLSearchParams()
  if (filters?.seasonId && filters.seasonId !== "all") params.set("seasonId", filters.seasonId)
  if (filters?.frontId && filters.frontId !== "all") params.set("frontId", filters.frontId)
  if (filters?.date) params.set("date", filters.date)
  if (filters?.tagIds && filters.tagIds.length > 0) {
    filters.tagIds.forEach(id => params.append("tagIds", id))
  }
  const url = params.toString()
    ? `${BASE_URL}/planting/productions?${params.toString()}`
    : `${BASE_URL}/planting/productions`
  return apiRequest<PlantingProduction[]>(url)
}

export const createProduction = async (data: PlantingProductionFormData) => {
  return apiRequest(`${BASE_URL}/planting/productions`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export const deleteProduction = async (id: string) => {
  return apiRequest(`${BASE_URL}/planting/productions/${id}`, {
    method: "DELETE",
  })
}

// ─── Daily Wages ─────────────────────────────────────────────────────────────

export const getDailyWages = async (filters?: { seasonId?: string; frontId?: string; date?: string; tagIds?: string[] }) => {
  const params = new URLSearchParams()
  if (filters?.seasonId && filters.seasonId !== "all") params.set("seasonId", filters.seasonId)
  if (filters?.frontId && filters.frontId !== "all") params.set("frontId", filters.frontId)
  if (filters?.date) params.set("date", filters.date)
  if (filters?.tagIds && filters.tagIds.length > 0) {
    filters.tagIds.forEach(id => params.append("tagIds", id))
  }
  const url = params.toString()
    ? `${BASE_URL}/planting/daily-wages?${params.toString()}`
    : `${BASE_URL}/planting/daily-wages`
  return apiRequest<DailyWage[]>(url)
}

export const createDailyWage = async (data: DailyWageFormData) => {
  return apiRequest(`${BASE_URL}/planting/daily-wages`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export const deleteDailyWage = async (id: string) => {
  return apiRequest(`${BASE_URL}/planting/daily-wages?id=${id}`, {
    method: "DELETE",
  })
}

// ─── Driver Allocations ──────────────────────────────────────────────────────

export const getDriverAllocations = async (filters?: { seasonId?: string; frontId?: string; date?: string; tagIds?: string[] }) => {
  const params = new URLSearchParams()
  if (filters?.seasonId && filters.seasonId !== "all") params.set("seasonId", filters.seasonId)
  if (filters?.frontId && filters.frontId !== "all") params.set("frontId", filters.frontId)
  if (filters?.date) params.set("date", filters.date)
  if (filters?.tagIds && filters.tagIds.length > 0) {
    filters.tagIds.forEach(id => params.append("tagIds", id))
  }
  const url = params.toString()
    ? `${BASE_URL}/planting/drivers?${params.toString()}`
    : `${BASE_URL}/planting/drivers`
  return apiRequest<DriverAllocation[]>(url)
}

export const createDriverAllocation = async (data: DriverAllocationFormData) => {
  return apiRequest(`${BASE_URL}/planting/drivers`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export const deleteDriverAllocation = async (id: string) => {
  return apiRequest(`${BASE_URL}/planting/drivers/${id}`, {
    method: "DELETE",
  })
}

// ─── Planting Areas ──────────────────────────────────────────────────────────

export const getPlantingAreas = async (filters?: { seasonId?: string; frontId?: string; date?: string }) => {
  const params = new URLSearchParams()
  if (filters?.seasonId && filters.seasonId !== "all") params.set("seasonId", filters.seasonId)
  if (filters?.frontId && filters.frontId !== "all") params.set("frontId", filters.frontId)
  if (filters?.date) params.set("date", filters.date)
  const url = params.toString()
    ? `${BASE_URL}/planting/areas?${params.toString()}`
    : `${BASE_URL}/planting/areas`
  return apiRequest<PlantingArea[]>(url)
}

export const createPlantingArea = async (data: PlantingAreaFormData) => {
  return apiRequest(`${BASE_URL}/planting/areas`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export const deletePlantingArea = async (id: string) => {
  return apiRequest(`${BASE_URL}/planting/areas/${id}`, {
    method: "DELETE",
  })
}

// ─── Advances ────────────────────────────────────────────────────────────────

export const getAdvances = async (filters?: { seasonId?: string; frontId?: string; date?: string; tagIds?: string[] }) => {
  const params = new URLSearchParams()
  if (filters?.seasonId && filters.seasonId !== "all") params.set("seasonId", filters.seasonId)
  if (filters?.frontId && filters.frontId !== "all") params.set("frontId", filters.frontId)
  if (filters?.date) params.set("date", filters.date)
  if (filters?.tagIds && filters.tagIds.length > 0) {
    filters.tagIds.forEach(id => params.append("tagIds", id))
  }
  
  const url = `${BASE_URL}/planting/advances?${params.toString()}`
  return apiRequest<PlantingAdvance[]>(url)
}
