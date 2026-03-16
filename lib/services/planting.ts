import {
  DailyWageFormData,
  DriverAllocationFormData,
  PlantingAreaFormData,
  PlantingDashboardMetrics,
  PlantingExpense,
  PlantingExpenseFormData,
  PlantingParameter,
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
  const res = await fetch(`${BASE_URL}/planting/seasons`)
  if (!res.ok) throw new Error("Erro ao buscar safras")
  return res.json()
}

export const createSeason = async (data: SeasonFormData): Promise<PlantingSeason> => {
  const res = await fetch(`${BASE_URL}/planting/seasons`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Erro ao criar safra")
  return res.json()
}

export const updateSeason = async (id: string, data: Partial<SeasonFormData>): Promise<PlantingSeason> => {
  const res = await fetch(`${BASE_URL}/planting/seasons/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Erro ao atualizar safra")
  return res.json()
}

export const deleteSeason = async (id: string): Promise<void> => {
  const res = await fetch(`${BASE_URL}/planting/seasons/${id}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Erro ao remover safra")
  return res.json()
}

// ─── Work Fronts ────────────────────────────────────────────────────────────

export const getWorkFronts = async (seasonId?: string): Promise<WorkFront[]> => {
  const url = seasonId
    ? `${BASE_URL}/planting/work-fronts?seasonId=${seasonId}`
    : `${BASE_URL}/planting/work-fronts`
  const res = await fetch(url)
  if (!res.ok) throw new Error("Erro ao buscar frentes de trabalho")
  return res.json()
}

export const createWorkFront = async (data: WorkFrontFormData & { seasonId: string }): Promise<WorkFront> => {
  const res = await fetch(`${BASE_URL}/planting/work-fronts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Erro ao criar frente de trabalho")
  return res.json()
}

// ─── Expenses ────────────────────────────────────────────────────────────────

export const getExpenses = async (filters?: { seasonId?: string; frontId?: string; date?: string }): Promise<PlantingExpense[]> => {
  const params = new URLSearchParams()
  if (filters?.seasonId && filters.seasonId !== "all") params.set("seasonId", filters.seasonId)
  if (filters?.frontId && filters.frontId !== "all") params.set("frontId", filters.frontId)
  if (filters?.date) params.set("date", filters.date)
  const url = params.toString()
    ? `${BASE_URL}/planting/expenses?${params.toString()}`
    : `${BASE_URL}/planting/expenses`
  const res = await fetch(url)
  if (!res.ok) throw new Error("Erro ao buscar gastos operacionais")
  return res.json()
}

export const createExpense = async (data: PlantingExpenseFormData): Promise<PlantingExpense> => {
  const res = await fetch(`${BASE_URL}/planting/expenses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.error || "Erro ao criar gasto")
  }
  return res.json()
}

export const deleteExpense = async (id: string): Promise<void> => {
  const res = await fetch(`${BASE_URL}/planting/expenses?id=${id}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Erro ao remover gasto")
  return res.json()
}

// ─── Parameters ──────────────────────────────────────────────────────────────

export const getParameters = async (): Promise<PlantingParameter[]> => {
  const res = await fetch(`${BASE_URL}/planting/parameters`)
  if (!res.ok) throw new Error("Erro ao buscar parâmetros")
  return res.json()
}

export const saveParameters = async (data: SaveParametersPayload): Promise<PlantingParameter[]> => {
  const res = await fetch(`${BASE_URL}/planting/parameters`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Erro ao salvar parâmetros")
  return res.json()
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const getDashboard = async (seasonId: string, filters?: { startDate?: string, endDate?: string }): Promise<PlantingDashboardMetrics> => {
  const params = new URLSearchParams({ seasonId })
  if (filters?.startDate) params.set("startDate", filters.startDate)
  if (filters?.endDate) params.set("endDate", filters.endDate)
  
  const res = await fetch(`${BASE_URL}/planting/dashboard?${params.toString()}`)
  if (!res.ok) throw new Error("Erro ao buscar métricas do dashboard")
  return res.json()
}

// ─── Productions ─────────────────────────────────────────────────────────────
// ─── Productions ─────────────────────────────────────────────────────────────

export const getProductions = async (filters?: { seasonId?: string; frontId?: string; date?: string }) => {
  const params = new URLSearchParams()
  if (filters?.seasonId && filters.seasonId !== "all") params.set("seasonId", filters.seasonId)
  if (filters?.frontId && filters.frontId !== "all") params.set("frontId", filters.frontId)
  if (filters?.date) params.set("date", filters.date)
  const url = params.toString()
    ? `${BASE_URL}/planting/productions?${params.toString()}`
    : `${BASE_URL}/planting/productions`
  const res = await fetch(url)
  if (!res.ok) throw new Error("Erro ao buscar produções")
  return res.json()
}

export const createProduction = async (data: PlantingProductionFormData) => {
  const res = await fetch(`${BASE_URL}/planting/productions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.error || "Erro ao criar produção")
  }
  return res.json()
}

export const deleteProduction = async (id: string) => {
  const res = await fetch(`${BASE_URL}/planting/productions/${id}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Erro ao remover produção")
  return res.json()
}

// ─── Daily Wages ─────────────────────────────────────────────────────────────

export const getDailyWages = async (filters?: { seasonId?: string; frontId?: string; date?: string }) => {
  const params = new URLSearchParams()
  if (filters?.seasonId && filters.seasonId !== "all") params.set("seasonId", filters.seasonId)
  if (filters?.frontId && filters.frontId !== "all") params.set("frontId", filters.frontId)
  if (filters?.date) params.set("date", filters.date)
  const url = params.toString()
    ? `${BASE_URL}/planting/daily-wages?${params.toString()}`
    : `${BASE_URL}/planting/daily-wages`
  const res = await fetch(url)
  if (!res.ok) throw new Error("Erro ao buscar diárias")
  return res.json()
}

export const createDailyWage = async (data: DailyWageFormData) => {
  const res = await fetch(`${BASE_URL}/planting/daily-wages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.error || "Erro ao criar diária")
  }
  return res.json()
}

export const deleteDailyWage = async (id: string) => {
  const res = await fetch(`${BASE_URL}/planting/daily-wages/${id}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Erro ao remover diária")
  return res.json()
}

// ─── Driver Allocations ──────────────────────────────────────────────────────

export const getDriverAllocations = async (filters?: { seasonId?: string; frontId?: string; date?: string }) => {
  const params = new URLSearchParams()
  if (filters?.seasonId && filters.seasonId !== "all") params.set("seasonId", filters.seasonId)
  if (filters?.frontId && filters.frontId !== "all") params.set("frontId", filters.frontId)
  if (filters?.date) params.set("date", filters.date)
  const url = params.toString()
    ? `${BASE_URL}/planting/drivers?${params.toString()}`
    : `${BASE_URL}/planting/drivers`
  const res = await fetch(url)
  if (!res.ok) throw new Error("Erro ao buscar alocações de motoristas")
  return res.json()
}

export const createDriverAllocation = async (data: DriverAllocationFormData) => {
  const res = await fetch(`${BASE_URL}/planting/drivers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.error || "Erro ao criar alocação de motorista")
  }
  return res.json()
}

export const deleteDriverAllocation = async (id: string) => {
  const res = await fetch(`${BASE_URL}/planting/drivers/${id}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Erro ao remover alocação")
  return res.json()
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
  const res = await fetch(url)
  if (!res.ok) throw new Error("Erro ao buscar áreas de plantio")
  return res.json()
}

export const createPlantingArea = async (data: PlantingAreaFormData) => {
  const res = await fetch(`${BASE_URL}/planting/areas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.error || "Erro ao criar área")
  }
  return res.json()
}

export const deletePlantingArea = async (id: string) => {
  const res = await fetch(`${BASE_URL}/planting/areas/${id}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Erro ao remover área")
  return res.json()
}
