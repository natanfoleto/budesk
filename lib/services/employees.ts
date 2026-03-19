import {
  AdvanceFormData,
  ContractFormData,
  EmployeeFormData,
  EmployeeWithDetails,
  EmploymentRecordFormData} from "@/types/employee"

const BASE_URL = "/api"

export interface GetEmployeesParams {
  page?: number
  limit?: number
  name?: string
  role?: string
  cpf?: string
  status?: string
  jobId?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export const getEmployees = async (params: GetEmployeesParams = {}): Promise<PaginatedResponse<EmployeeWithDetails>> => {
  const query = new URLSearchParams()
  if (params.page) query.append("page", params.page.toString())
  if (params.limit) query.append("limit", params.limit.toString())
  if (params.name) query.append("name", params.name)
  if (params.role) query.append("role", params.role)
  if (params.cpf) query.append("cpf", params.cpf)
  if (params.status) query.append("status", params.status)
  if (params.jobId) query.append("jobId", params.jobId)

  const res = await fetch(`${BASE_URL}/employees?${query.toString()}`)
  if (!res.ok) throw new Error("Erro ao buscar funcionários")
  return res.json()
}

export const createEmployee = async (data: EmployeeFormData) => {
  const res = await fetch(`${BASE_URL}/employees`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Erro ao criar funcionário")
  return res.json()
}

export const getEmployee = async (id: string): Promise<EmployeeWithDetails> => {
  const res = await fetch(`${BASE_URL}/employees/${id}`)
  if (!res.ok) throw new Error("Erro ao buscar funcionário")
  return res.json()
}

export const updateEmployee = async (id: string, data: Partial<EmployeeFormData>) => {
  const res = await fetch(`${BASE_URL}/employees/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Erro ao atualizar funcionário")
  return res.json()
}

export const deleteEmployee = async (id: string) => {
  const res = await fetch(`${BASE_URL}/employees/${id}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Erro ao excluir funcionário")
  return res.json()
}

// Sub-resources

export const getEmploymentRecords = async (employeeId: string) => {
  const res = await fetch(`${BASE_URL}/employees/${employeeId}/records`)
  if (!res.ok) throw new Error("Erro ao buscar registros de vínculo")
  return res.json()
}

export const createEmploymentRecord = async (employeeId: string, data: EmploymentRecordFormData) => {
  const res = await fetch(`${BASE_URL}/employees/${employeeId}/records`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Erro ao criar registro")
  return res.json()
}

export const getEmployeeContracts = async (employeeId: string) => {
  const res = await fetch(`${BASE_URL}/employees/${employeeId}/contracts`)
  if (!res.ok) throw new Error("Erro ao buscar contratos")
  return res.json()
}

export const createEmployeeContract = async (employeeId: string, data: ContractFormData) => {
  const res = await fetch(`${BASE_URL}/employees/${employeeId}/contracts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Erro ao criar contrato")
  return res.json()
}

export const getEmployeeAdvances = async (employeeId: string) => {
  const res = await fetch(`${BASE_URL}/employees/${employeeId}/advances`)
  if (!res.ok) throw new Error("Erro ao buscar adiantamentos")
  return res.json()
}

export const createEmployeeAdvance = async (employeeId: string, data: AdvanceFormData) => {
  const res = await fetch(`${BASE_URL}/employees/${employeeId}/advances`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Erro ao criar adiantamento")
  return res.json()
}

