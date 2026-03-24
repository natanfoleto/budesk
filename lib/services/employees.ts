import { apiRequest } from "@/lib/api-client"
import {
  AdvanceFormData,
  ContractFormData,
  EmployeeFormData,
  EmployeeWithDetails,
  EmploymentRecordFormData
} from "@/types/employee"

const BASE_URL = "/api"

export interface GetEmployeesParams {
  page?: number
  limit?: number
  name?: string
  role?: string
  cpf?: string
  status?: string
  jobId?: string
  tagIds?: string[]
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
  if (params.tagIds && params.tagIds.length > 0) {
    params.tagIds.forEach(id => query.append("tagIds", id))
  }

  return apiRequest<PaginatedResponse<EmployeeWithDetails>>(`${BASE_URL}/employees?${query.toString()}`)
}

export const createEmployee = async (data: EmployeeFormData) => {
  return apiRequest(`${BASE_URL}/employees`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export const getEmployee = async (id: string): Promise<EmployeeWithDetails> => {
  return apiRequest<EmployeeWithDetails>(`${BASE_URL}/employees/${id}`)
}

export const updateEmployee = async (id: string, data: Partial<EmployeeFormData>) => {
  return apiRequest(`${BASE_URL}/employees/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export const deleteEmployee = async (id: string) => {
  return apiRequest(`${BASE_URL}/employees/${id}`, {
    method: "DELETE",
  })
}

// Sub-resources

export const getEmploymentRecords = async (employeeId: string) => {
  return apiRequest(`${BASE_URL}/employees/${employeeId}/records`)
}

export const createEmploymentRecord = async (employeeId: string, data: EmploymentRecordFormData) => {
  return apiRequest(`${BASE_URL}/employees/${employeeId}/records`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export const getEmployeeContracts = async (employeeId: string) => {
  return apiRequest(`${BASE_URL}/employees/${employeeId}/contracts`)
}

export const createEmployeeContract = async (employeeId: string, data: ContractFormData) => {
  return apiRequest(`${BASE_URL}/employees/${employeeId}/contracts`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export const getEmployeeAdvances = async (employeeId: string) => {
  return apiRequest(`${BASE_URL}/employees/${employeeId}/advances`)
}

export const createEmployeeAdvance = async (employeeId: string, data: AdvanceFormData) => {
  return apiRequest(`${BASE_URL}/employees/${employeeId}/advances`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

