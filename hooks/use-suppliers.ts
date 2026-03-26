import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  createSupplier,
  deleteSupplier,
  getSupplier,
  getSuppliers,
  updateSupplier,
} from '@/lib/services/suppliers'
import { FindManySupplierArgs, SupplierFormData } from '@/types/supplier'

export const useSuppliers = (params?: FindManySupplierArgs) => {
  return useQuery({
    queryKey: ['suppliers', params],
    queryFn: () => getSuppliers(params),
  })
}

export const useSupplier = (id: string) => {
  return useQuery({
    queryKey: ['supplier', id],
    queryFn: () => getSupplier(id),
    enabled: !!id,
  })
}

export const useCreateSupplier = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success('Fornecedor criado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar fornecedor')
    },
  })
}

export const useUpdateSupplier = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<SupplierFormData>;
    }) => updateSupplier(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['supplier', variables.id] })
      toast.success('Fornecedor atualizado!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar fornecedor')
    },
  })
}

export const useDeleteSupplier = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteSupplier,
    onSuccess: (data: { message?: string }) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success(data?.message || 'Operação realizada com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao excluir/inativar fornecedor')
    },
  })
}
