import { AttendanceType, PlantingProductionType } from "@prisma/client"

export interface PlantingSeason {
  id: string
  name: string
  startDate: string
  endDate: string | null
  active: boolean
  totalArea: number | null
  notes: string | null
  createdAt: string
  updatedAt: string
  _count?: {
    workFronts: number
    plantingProductions: number
  }
}

export interface WorkFront {
  id: string
  seasonId: string
  name: string
  description: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface PlantingProduction {
  id: string
  date: string
  employeeId: string
  frontId: string
  seasonId: string
  type: PlantingProductionType
  meters: number | null
  meterValueInCents: number
  totalValueInCents: number
  presence: AttendanceType
  notes: string | null
  isClosed: boolean
  employee?: { name: string }
  front?: { name: string }
}

export interface DailyWage {
  id: string
  date: string
  employeeId: string
  frontId: string
  seasonId: string
  valueInCents: number
  presence: AttendanceType
  notes: string | null
  isClosed: boolean
  employee?: { name: string }
  front?: { name: string }
}

export interface DriverCategory {
  id: string
  name: string
  defaultDailyValueInCents: number
  notes: string | null
  active: boolean
}

export interface DriverAllocation {
  id: string
  date: string
  employeeId: string
  vehicleId?: string
  frontId: string
  seasonId: string
  valueInCents: number
  notes: string | null
  isClosed: boolean
  employee?: { name: string }
  vehicle?: { plate: string; model: string | null }
  front?: { name: string }
}

export interface PlantingArea {
  id: string
  date: string
  frontId: string
  seasonId: string
  workedArea: number
  hectares: number
  notes: string | null
  isClosed: boolean
  front?: { name: string }
}

export interface PlantingAdvance {
  id: string
  date: string
  employeeId: string
  frontId: string
  seasonId: string
  valueInCents: number
  notes: string | null
  discountInCurrentFortnight: boolean
  isClosed: boolean
  employee?: { name: string }
  front?: { name: string }
}

export interface PlantingExpense {
  id: string
  date: string
  frontId: string
  seasonId: string
  category: import("@prisma/client").ExpenseCategory
  description: string
  quantity: number | null
  unitValueInCents: number | null
  totalValueInCents: number
  vehicleId: string | null
  notes: string | null
  isClosed: boolean
  vehicle?: { plate: string }
  front?: { name: string }
}

export interface PlantingParameter {
  key: string
  value: string
  description: string | null
  updatedAt: string
}

export interface PlantingDashboardMetrics {
  totalCostInCents: number
  totalHectares: number
  costPerHectareInCents: number
  totalMeters: number
  totalPlantingMeters: number
  totalCuttingMeters: number
  breakdown: {
    productions: number
    planting: number
    cutting: number
    wages: number
    allocations: number
    expenses: number
    advances: number
  }
}

export interface PlantingDashboardChartData {
  date: string
  cost: number
  meters: number
  planting: number
  cutting: number
  wages: number
  drivers: number
  expenses: number
}

// Form Data Types

export interface SeasonFormData {
  name: string
  startDate: string
  endDate?: string
  totalArea?: number
  notes?: string
  active: boolean
}

export interface WorkFrontFormData {
  name: string
  description?: string
  active: boolean
}

export interface PlantingProductionFormData {
  id?: string
  date: string
  employeeId: string
  frontId: string
  seasonId: string
  type: PlantingProductionType
  meters?: number
  meterValueInCents?: number
  presence?: AttendanceType
  notes?: string
}

export interface DailyWageFormData {
  id?: string
  date: string
  employeeId: string
  frontId: string
  seasonId: string
  valueInCents: number
  presence?: AttendanceType
  notes?: string
}

export interface DriverAllocationFormData {
  date: string
  employeeId: string
  vehicleId?: string
  frontId: string
  seasonId: string
  valueInCents: number
  notes?: string
}

export interface PlantingAreaFormData {
  date: string
  frontId: string
  seasonId: string
  workedArea: number
  hectares: number
  notes?: string
}

export interface PlantingAdvanceFormData {
  id?: string
  date: string
  employeeId: string
  frontId: string
  seasonId: string
  valueInCents: number
  notes?: string
  discountInCurrentFortnight: boolean
}

export interface PlantingExpenseFormData {
  date: string
  frontId: string
  seasonId: string
  vehicleId?: string
  category?: string
  description: string
  itemDescription?: string
  invoiceNumber?: string
  quantity?: number
  unitValueInCents?: number
  notes?: string
}

export interface SaveParametersPayload {
  parameters: { key: string; valueInCents: number; description?: string }[]
}
