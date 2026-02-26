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
  const res = await fetch(`${BASE_URL}/payments?${params}`)
  if (!res.ok) throw new Error("Erro ao buscar pagamentos")
  return res.json()
}

export const createRHPayment = async (data: RHPaymentFormData) => {
  const res = await fetch(`${BASE_URL}/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Erro ao criar pagamento")
  return res.json()
}

export const updateRHPayment = async (id: string, data: Partial<RHPaymentFormData>) => {
  const res = await fetch(`${BASE_URL}/payments/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Erro ao atualizar pagamento")
  return res.json()
}

export const deleteRHPayment = async (id: string) => {
  const res = await fetch(`${BASE_URL}/payments/${id}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Erro ao excluir pagamento")
  return res.json()
}

// Salary History
export const getSalaryHistory = async (employeeId: string): Promise<SalaryHistory[]> => {
  const res = await fetch(`${BASE_URL}/salary-history?employeeId=${employeeId}`)
  if (!res.ok) throw new Error("Erro ao buscar histórico salarial")
  return res.json()
}

// Vacations
export const getVacations = async (employeeId?: string): Promise<Vacation[]> => {
  const params = employeeId ? `?employeeId=${employeeId}` : ""
  const res = await fetch(`${BASE_URL}/vacations${params}`)
  if (!res.ok) throw new Error("Erro ao buscar férias")
  return res.json()
}

export const createVacation = async (data: VacationFormData) => {
  const res = await fetch(`${BASE_URL}/vacations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Erro ao criar férias")
  return res.json()
}

export const updateVacation = async (id: string, data: Partial<VacationFormData>) => {
  const res = await fetch(`${BASE_URL}/vacations/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Erro ao atualizar férias")
  return res.json()
}

export const deleteVacation = async (id: string) => {
  const res = await fetch(`${BASE_URL}/vacations/${id}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Erro ao excluir férias")
  return res.json()
}

// Thirteenth Salary
export const getThirteenths = async (employeeId?: string): Promise<ThirteenthSalary[]> => {
  const params = employeeId ? `?employeeId=${employeeId}` : ""
  const res = await fetch(`${BASE_URL}/thirteenth${params}`)
  if (!res.ok) throw new Error("Erro ao buscar 13º")
  return res.json()
}

export const createThirteenth = async (data: ThirteenthFormData) => {
  const res = await fetch(`${BASE_URL}/thirteenth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Erro ao criar 13º")
  return res.json()
}

export const updateThirteenth = async (id: string, data: Partial<ThirteenthSalary>) => {
  const res = await fetch(`${BASE_URL}/thirteenth/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Erro ao atualizar 13º")
  return res.json()
}

export const deleteThirteenth = async (id: string) => {
  const res = await fetch(`${BASE_URL}/thirteenth/${id}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Erro ao excluir 13º")
  return res.json()
}

// Time Bank
export const getTimeBanks = async (employeeId?: string): Promise<TimeBank[]> => {
  const params = employeeId ? `?employeeId=${employeeId}` : ""
  const res = await fetch(`${BASE_URL}/timebank${params}`)
  if (!res.ok) throw new Error("Erro ao buscar banco de horas")
  return res.json()
}

export const updateTimeBank = async (data: { employeeId: string; horasCredito?: number; horasDebito?: number }) => {
  const res = await fetch(`${BASE_URL}/timebank`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Erro ao atualizar banco de horas")
  return res.json()
}

// Attendance
export const getAttendance = async (filters: { employeeId?: string; month?: string }): Promise<AttendanceRecord[]> => {
  const params = new URLSearchParams(filters as Record<string, string>)
  const res = await fetch(`${BASE_URL}/attendance?${params}`)
  if (!res.ok) throw new Error("Erro ao buscar frequência")
  return res.json()
}

export const createAttendance = async (data: AttendanceFormData) => {
  const res = await fetch(`${BASE_URL}/attendance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Erro ao salvar frequência")
  return res.json()
}

// Reports
export const getMonthlyCostReport = async (year: string): Promise<RHReportMonthlyCost[]> => {
  const res = await fetch(`${BASE_URL}/reports?type=monthly-cost&year=${year}`)
  if (!res.ok) throw new Error("Erro ao buscar relatório")
  return res.json()
}

export const getEmployeeCostReport = async (startDate?: string, endDate?: string): Promise<RHReportEmployeeCost[]> => {
  const params = new URLSearchParams()
  params.append("type", "employee-cost")
  if (startDate) params.append("startDate", startDate)
  if (endDate) params.append("endDate", endDate)
  
  const res = await fetch(`${BASE_URL}/reports?${params}`)
  if (!res.ok) throw new Error("Erro ao buscar relatório")
  return res.json()
}
