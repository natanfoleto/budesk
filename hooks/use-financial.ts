import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  createAccountPayable,
  createTransaction,
  deleteAccountPayable,
  deleteTransaction,
  getAccountsPayable,
  getDashboardMetrics,
  getTransactions,
  updateAccountPayable,
  updateTransaction,
} from "@/lib/services/financial"

export const useTransactions = (filters?: any) => {
  return useQuery({
    queryKey: ["transactions", filters],
    queryFn: () => getTransactions(filters),
  })
}

export const useCreateTransaction = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] })
      toast.success("Transação criada com sucesso!")
    },
    onError: () => toast.error("Erro ao criar transação"),
  })
}

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] })
      toast.success("Transação atualizada!")
    },
    onError: () => toast.error("Erro ao atualizar transação"),
  })
}

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] })
      toast.success("Transação excluída!")
    },
    onError: () => toast.error("Erro ao excluir transação"),
  })
}

export const useAccountsPayable = (filters?: any) => {
  return useQuery({
    queryKey: ["payables", filters],
    queryFn: () => getAccountsPayable(filters),
  })
}

export const useCreateAccountPayable = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createAccountPayable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payables"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] })
      toast.success("Conta a pagar criada!")
    },
    onError: () => toast.error("Erro ao criar conta"),
  })
}

export const useUpdateAccountPayable = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateAccountPayable(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payables"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] })
      toast.success("Conta a pagar atualizada!")
    },
    onError: () => toast.error("Erro ao atualizar conta"),
  })
}

export const useDeleteAccountPayable = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteAccountPayable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payables"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] })
      toast.success("Conta a pagar excluída!")
    },
    onError: () => toast.error("Erro ao excluir conta"),
  })
}

export const useDashboardMetrics = (month?: number, year?: number) => {
  return useQuery({
    queryKey: ["dashboard-metrics", month, year],
    queryFn: () => getDashboardMetrics(month, year),
  })
}
