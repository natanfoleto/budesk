import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  createEmployee,
  createEmployeeAdvance,
  createEmployeeContract,
  createEmploymentRecord,
  createTimeRecord,
  deleteEmployee,
  getEmployee,
  getEmployeeAdvances,
  getEmployeeContracts,
  getEmployees,
  getEmploymentRecords,
  getTimeRecords,
  updateEmployee,
} from "@/lib/services/employees"
import { 
  AdvanceFormData, 
  ContractFormData, 
  EmployeeFormData, 
  EmploymentRecordFormData, 
  TimeRecordFormData 
} from "@/types/employee"

// Employees CRUD

export const useEmployees = () => {
  return useQuery({
    queryKey: ["employees"],
    queryFn: getEmployees,
  })
}

export const useEmployee = (id: string) => {
  return useQuery({
    queryKey: ["employee", id],
    queryFn: () => getEmployee(id),
    enabled: !!id,
  })
}

export const useCreateEmployee = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] })
      toast.success("Funcionário criado com sucesso!")
    },
    onError: () => toast.error("Erro ao criar funcionário"),
  })
}

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EmployeeFormData> }) => updateEmployee(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] })
      queryClient.invalidateQueries({ queryKey: ["employee", variables.id] })
      toast.success("Funcionário atualizado!")
    },
    onError: () => toast.error("Erro ao atualizar funcionário"),
  })
}

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] })
      toast.success("Funcionário excluído!")
    },
    onError: () => toast.error("Erro ao excluir funcionário"),
  })
}

// Sub-resources Hooks

export const useEmploymentRecords = (employeeId: string) => {
  return useQuery({
    queryKey: ["employment-records", employeeId],
    queryFn: () => getEmploymentRecords(employeeId),
    enabled: !!employeeId,
  })
}

export const useCreateEmploymentRecord = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ employeeId, data }: { employeeId: string; data: EmploymentRecordFormData }) => createEmploymentRecord(employeeId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["employment-records", variables.employeeId] })
      toast.success("Registro de vínculo criado!")
    },
    onError: () => toast.error("Erro ao criar registro"),
  })
}

export const useEmployeeContracts = (employeeId: string) => {
  return useQuery({
    queryKey: ["employee-contracts", employeeId],
    queryFn: () => getEmployeeContracts(employeeId),
    enabled: !!employeeId,
  })
}

export const useCreateEmployeeContract = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ employeeId, data }: { employeeId: string; data: ContractFormData }) => createEmployeeContract(employeeId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["employee-contracts", variables.employeeId] })
      toast.success("Contrato criado!")
    },
    onError: () => toast.error("Erro ao criar contrato"),
  })
}

export const useEmployeeAdvances = (employeeId: string) => {
  return useQuery({
    queryKey: ["employee-advances", employeeId],
    queryFn: () => getEmployeeAdvances(employeeId),
    enabled: !!employeeId,
  })
}

export const useCreateEmployeeAdvance = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ employeeId, data }: { employeeId: string; data: AdvanceFormData }) => createEmployeeAdvance(employeeId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["employee-advances", variables.employeeId] })
      queryClient.invalidateQueries({ queryKey: ["transactions"] }) // Update financial transactions too
      toast.success("Adiantamento criado!")
    },
    onError: () => toast.error("Erro ao criar adiantamento"),
  })
}

export const useTimeRecords = (employeeId: string) => {
  return useQuery({
    queryKey: ["time-records", employeeId],
    queryFn: () => getTimeRecords(employeeId),
    enabled: !!employeeId,
  })
}

export const useCreateTimeRecord = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ employeeId, data }: { employeeId: string; data: TimeRecordFormData }) => createTimeRecord(employeeId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["time-records", variables.employeeId] })
      toast.success("Ponto registrado!")
    },
    onError: () => toast.error("Erro ao registrar ponto"),
  })
}
