import {
  AdvanceFormData,
  ContractFormData,
  EmployeeFormData,
  EmployeeWithDetails,
  EmploymentRecordFormData,
  TimeRecordFormData} from "@/types/employee"
import { Employee } from "@prisma/client"

const BASE_URL = "/api"

export const getEmployees = async (): Promise<Employee[]> => {
  const res = await fetch(`${BASE_URL}/employees`)
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

export const getTimeRecords = async (employeeId: string) => {
  const res = await fetch(`${BASE_URL}/employees/${employeeId}/time-tracking`)
  if (!res.ok) throw new Error("Erro ao buscar registros de ponto")
  return res.json()
}

export const createTimeRecord = async (employeeId: string, data: TimeRecordFormData) => {
  const res = await fetch(`${BASE_URL}/employees/${employeeId}/time-tracking`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Erro ao criar registro de ponto")
  return res.json()
}
