import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { apiRequest } from '@/lib/api-client'
import {
  createEmployee,
  createEmployeeAdvance,
  createEmployeeContract,
  createEmploymentRecord,
  deleteEmployee,
  getEmployee,
  getEmployeeAdvances,
  getEmployeeContracts,
  getEmployees,
  GetEmployeesParams,
  getEmploymentRecords,
  updateEmployee,
} from '@/lib/services/employees'
import {
  AdvanceFormData,
  ContractFormData,
  EmployeeAccountFormData,
  EmployeeFormData,
  EmploymentRecordFormData,
} from '@/types/employee'

// Employees CRUD

export const useEmployees = (params?: GetEmployeesParams) => {
  return useQuery({
    queryKey: ['employees', params],
    queryFn: () => getEmployees(params),
  })
}

export const useEmployee = (id: string) => {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: () => getEmployee(id),
    enabled: !!id,
  })
}

export const useCreateEmployee = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Funcionário criado com sucesso!')
    },
    onError: () => toast.error('Erro ao criar funcionário'),
  })
}

export const useUpdateEmployee = (options?: { silent?: boolean }) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<EmployeeFormData>;
    }) => updateEmployee(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.invalidateQueries({ queryKey: ['employee', variables.id] })
      if (!options?.silent) {
        toast.success('Funcionário atualizado!')
      }
    },
    onError: () => toast.error('Erro ao atualizar funcionário'),
  })
}

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Funcionário excluído!')
    },
    onError: () => toast.error('Erro ao excluir funcionário'),
  })
}

// Sub-resources Hooks

export const useEmploymentRecords = (employeeId: string) => {
  return useQuery({
    queryKey: ['employment-records', employeeId],
    queryFn: () => getEmploymentRecords(employeeId),
    enabled: !!employeeId,
  })
}

export const useCreateEmploymentRecord = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      employeeId,
      data,
    }: {
      employeeId: string;
      data: EmploymentRecordFormData;
    }) => createEmploymentRecord(employeeId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['employment-records', variables.employeeId],
      })
      toast.success('Registro de vínculo criado!')
    },
    onError: () => toast.error('Erro ao criar registro'),
  })
}

export const useEmployeeContracts = (employeeId: string) => {
  return useQuery({
    queryKey: ['employee-contracts', employeeId],
    queryFn: () => getEmployeeContracts(employeeId),
    enabled: !!employeeId,
  })
}

export const useCreateEmployeeContract = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      employeeId,
      data,
    }: {
      employeeId: string;
      data: ContractFormData;
    }) => createEmployeeContract(employeeId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['employee-contracts', variables.employeeId],
      })
      toast.success('Contrato criado!')
    },
    onError: () => toast.error('Erro ao criar contrato'),
  })
}

export const useEmployeeAdvances = (employeeId: string) => {
  return useQuery({
    queryKey: ['employee-advances', employeeId],
    queryFn: () => getEmployeeAdvances(employeeId),
    enabled: !!employeeId,
  })
}

export const useCreateEmployeeAdvance = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      employeeId,
      data,
    }: {
      employeeId: string;
      data: AdvanceFormData;
    }) => createEmployeeAdvance(employeeId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['employee-advances', variables.employeeId],
      })
      queryClient.invalidateQueries({ queryKey: ['transactions'] }) // Update financial transactions too
      toast.success('Adiantamento criado!')
    },
    onError: () => toast.error('Erro ao criar adiantamento'),
  })
}

// Update/Delete Hooks

export const useUpdateEmploymentRecord = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      employeeId,
      recordId,
      data,
    }: {
      employeeId: string;
      recordId: string;
      data: EmploymentRecordFormData;
    }) => {
      return apiRequest(`/api/employees/${employeeId}/records/${recordId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['employment-records', variables.employeeId],
      })
      toast.success('Vínculo atualizado!')
    },
    onError: () => toast.error('Erro ao atualizar vínculo'),
  })
}

export const useDeleteEmploymentRecord = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      employeeId,
      recordId,
    }: {
      employeeId: string;
      recordId: string;
    }) => {
      return apiRequest(`/api/employees/${employeeId}/records/${recordId}`, {
        method: 'DELETE',
      })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['employment-records', variables.employeeId],
      })
      toast.success('Vínculo excluído!')
    },
    onError: () => toast.error('Erro ao excluir vínculo'),
  })
}

export const useUpdateEmployeeAdvance = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      employeeId,
      advanceId,
      data,
    }: {
      employeeId: string;
      advanceId: string;
      data: AdvanceFormData;
    }) => {
      return apiRequest(`/api/employees/${employeeId}/advances/${advanceId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['employee-advances', variables.employeeId],
      })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      toast.success('Adiantamento atualizado!')
    },
    onError: () => toast.error('Erro ao atualizar adiantamento'),
  })
}

export const useDeleteEmployeeAdvance = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      employeeId,
      advanceId,
    }: {
      employeeId: string;
      advanceId: string;
    }) => {
      return apiRequest(`/api/employees/${employeeId}/advances/${advanceId}`, {
        method: 'DELETE',
      })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['employee-advances', variables.employeeId],
      })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      toast.success('Adiantamento excluído e estornado!')
    },
    onError: () => toast.error('Erro ao excluir adiantamento'),
  })
}

export const useUpdateEmployeeContract = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      employeeId,
      contractId,
      data,
    }: {
      employeeId: string;
      contractId: string;
      data: ContractFormData;
    }) => {
      return apiRequest(`/api/employees/${employeeId}/contracts/${contractId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['employee-contracts', variables.employeeId],
      })
      toast.success('Contrato atualizado!')
    },
    onError: () => toast.error('Erro ao atualizar contrato'),
  })
}

export const useDeleteEmployeeContract = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      employeeId,
      contractId,
    }: {
      employeeId: string;
      contractId: string;
    }) => {
      return apiRequest(`/api/employees/${employeeId}/contracts/${contractId}`, {
        method: 'DELETE',
      })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['employee-contracts', variables.employeeId],
      })
      toast.success('Contrato excluído!')
    },
    onError: () => toast.error('Erro ao excluir contrato'),
  })
}

export const useEmployeeAccounts = (employeeId: string) => {
  return useQuery({
    queryKey: ['employee-accounts', employeeId],
    queryFn: () => apiRequest(`/api/employees/${employeeId}/accounts`),
    enabled: !!employeeId,
  })
}

export const useCreateEmployeeAccount = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      employeeId,
      data,
    }: {
      employeeId: string;
      data: EmployeeAccountFormData;
    }) => {
      return apiRequest(`/api/employees/${employeeId}/accounts`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['employee-accounts', variables.employeeId],
      })
      toast.success('Conta bancária/PIX adicionada!')
    },
    onError: () => toast.error('Erro ao adicionar conta'),
  })
}

export const useUpdateEmployeeAccount = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      employeeId,
      accountId,
      data,
    }: {
      employeeId: string;
      accountId: string;
      data: EmployeeAccountFormData;
    }) => {
      return apiRequest(`/api/employees/${employeeId}/accounts/${accountId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['employee-accounts', variables.employeeId],
      })
      toast.success('Conta bancária/PIX atualizada!')
    },
    onError: () => toast.error('Erro ao atualizar conta'),
  })
}

export const useDeleteEmployeeAccount = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      employeeId,
      accountId,
    }: {
      employeeId: string;
      accountId: string;
    }) => {
      return apiRequest(`/api/employees/${employeeId}/accounts/${accountId}`, {
        method: 'DELETE',
      })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['employee-accounts', variables.employeeId],
      })
      toast.success('Conta excluída!')
    },
    onError: () => toast.error('Erro ao excluir conta'),
  })
}
