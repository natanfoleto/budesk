import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  addInstallmentAttachment,
  createAccountPayable,
  createTransaction,
  deleteAccountPayable,
  deleteInstallmentAttachment,
  deleteTransaction,
  getAccountsPayable,
  getDashboardMetrics,
  getTransactions,
  updateAccountInstallment,
  updateAccountPayable,
  updateInstallmentAttachment,
  updateTransaction,
} from "@/lib/services/financial"
import { AccountPayableInput, Transaction } from "@/types/financial"

export const useTransactions = (filters?: Record<string, string>) => {
  return useQuery({
    queryKey: ["transactions", filters],
    queryFn: () => getTransactions(filters || {}),
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
    mutationFn: ({ id, data }: { id: string; data: Partial<Transaction> }) => updateTransaction(id, data),
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

export const useAccountsPayable = (filters?: Record<string, string>) => {
  return useQuery({
    queryKey: ["payables", filters],
    queryFn: () => getAccountsPayable(filters || {}),
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
    mutationFn: ({ id, data }: { id: string; data: AccountPayableInput }) => updateAccountPayable(id, data),
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

export const useUpdateAccountInstallment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, paymentDate }: { id: string; status: string; paymentDate?: string | Date }) => 
      updateAccountInstallment(id, status, paymentDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payables"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] })
      toast.success("Parcela atualizada!")
    },
    onError: (error: Error) => toast.error(error.message || "Erro ao atualizar parcela"),
  })
}

export const useDashboardMetrics = (month?: number, year?: number) => {
  return useQuery({
    queryKey: ["dashboard-metrics", month, year],
    queryFn: () => getDashboardMetrics(month, year),
  })
}

export const useAddInstallmentAttachment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ installmentId, data }: { installmentId: string; data: { type: string; fileUrl: string; fileName: string } }) => 
      addInstallmentAttachment(installmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payables"] })
      toast.success("Anexo adicionado!")
    },
    onError: () => toast.error("Erro ao adicionar anexo"),
  })
}

export const useDeleteInstallmentAttachment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ installmentId, attachmentId }: { installmentId: string; attachmentId: string }) => 
      deleteInstallmentAttachment(installmentId, attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payables"] })
      toast.success("Anexo removido!")
    },
    onError: () => toast.error("Erro ao remover anexo"),
  })
}

export const useUpdateInstallmentAttachment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ installmentId, attachmentId, type }: { installmentId: string; attachmentId: string; type: string }) => 
      updateInstallmentAttachment(installmentId, attachmentId, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payables"] })
      toast.success("Anexo atualizado!")
    },
    onError: () => toast.error("Erro ao atualizar anexo"),
  })
}
