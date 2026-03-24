import { apiRequest } from "@/lib/api-client"
import {
  AttendanceFormData,
  AttendanceRecord,
  RHPayment,
  RHPaymentFormData,
  RHReportEmployeeCost,
  RHReportMonthlyCost,
  SalaryHistory,
  ThirteenthFormData,
  ThirteenthSalary,
  TimeBank,
  Vacation,
  VacationFormData,
} from "@/types/rh"

const BASE_URL = "/api/rh"

// Payments
export const getRHPayments = async (filters: Record<string, string>): Promise<RHPayment[]> => {
  const params = new URLSearchParams(filters)
  return apiRequest<RHPayment[]>(`${BASE_URL}/payments?${params}`)
}

export const createRHPayment = async (data: RHPaymentFormData) => {
  return apiRequest(`${BASE_URL}/payments`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export const updateRHPayment = async (id: string, data: Partial<RHPaymentFormData>) => {
  return apiRequest(`${BASE_URL}/payments/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export const deleteRHPayment = async (id: string) => {
  return apiRequest(`${BASE_URL}/payments/${id}`, {
    method: "DELETE",
  })
}

// Salary History
export const getSalaryHistory = async (employeeId: string): Promise<SalaryHistory[]> => {
  return apiRequest<SalaryHistory[]>(`${BASE_URL}/salary-history?employeeId=${employeeId}`)
}

// Vacations
export const getVacations = async (employeeId?: string): Promise<Vacation[]> => {
  const params = employeeId ? `?employeeId=${employeeId}` : ""
  return apiRequest<Vacation[]>(`${BASE_URL}/vacations${params}`)
}

export const createVacation = async (data: VacationFormData) => {
  return apiRequest(`${BASE_URL}/vacations`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export const updateVacation = async (id: string, data: Partial<VacationFormData>) => {
  return apiRequest(`${BASE_URL}/vacations/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export const deleteVacation = async (id: string) => {
  return apiRequest(`${BASE_URL}/vacations/${id}`, {
    method: "DELETE",
  })
}

// Thirteenth Salary
export const getThirteenths = async (employeeId?: string): Promise<ThirteenthSalary[]> => {
  const params = employeeId ? `?employeeId=${employeeId}` : ""
  return apiRequest<ThirteenthSalary[]>(`${BASE_URL}/thirteenth${params}`)
}

export const createThirteenth = async (data: ThirteenthFormData) => {
  return apiRequest(`${BASE_URL}/thirteenth`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export const updateThirteenth = async (id: string, data: Partial<ThirteenthSalary>) => {
  return apiRequest(`${BASE_URL}/thirteenth/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export const deleteThirteenth = async (id: string) => {
  return apiRequest(`${BASE_URL}/thirteenth/${id}`, {
    method: "DELETE",
  })
}

// Time Bank
export const getTimeBanks = async (employeeId?: string): Promise<TimeBank[]> => {
  const params = employeeId ? `?employeeId=${employeeId}` : ""
  return apiRequest<TimeBank[]>(`${BASE_URL}/timebank${params}`)
}

export const updateTimeBank = async (data: { employeeId: string; horasCredito?: number; horasDebito?: number }) => {
  return apiRequest(`${BASE_URL}/timebank`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

// Attendance
export const getAttendance = async (filters: { employeeId?: string; month?: string }): Promise<AttendanceRecord[]> => {
  const params = new URLSearchParams(filters as Record<string, string>)
  return apiRequest<AttendanceRecord[]>(`${BASE_URL}/attendance?${params}`)
}

export const createAttendance = async (data: AttendanceFormData) => {
  return apiRequest(`${BASE_URL}/attendance`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

// Reports
export const getMonthlyCostReport = async (year: string): Promise<RHReportMonthlyCost[]> => {
  return apiRequest<RHReportMonthlyCost[]>(`${BASE_URL}/reports?type=monthly-cost&year=${year}`)
}

export const getEmployeeCostReport = async (startDate?: string, endDate?: string): Promise<RHReportEmployeeCost[]> => {
  const params = new URLSearchParams()
  params.append("type", "employee-cost")
  if (startDate) params.append("startDate", startDate)
  if (endDate) params.append("endDate", endDate)
  
  return apiRequest<RHReportEmployeeCost[]>(`${BASE_URL}/reports?${params}`)
}
