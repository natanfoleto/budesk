import { apiRequest } from "@/lib/api-client"
import { PaginatedResponse } from "@/types/api"
import { AccountPayable, AccountPayableInput, Transaction } from "@/types/financial"

const BASE_URL = "/api"

export const getTransactions = async (filters: Record<string, string>): Promise<PaginatedResponse<Transaction>> => {
  const params = new URLSearchParams(filters)
  return apiRequest<PaginatedResponse<Transaction>>(`${BASE_URL}/financial-transactions?${params}`)
}

export const createTransaction = async (data: Partial<Transaction>) => {
  return apiRequest(`${BASE_URL}/financial-transactions`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export const updateTransaction = async (id: string, data: Partial<Transaction>) => {
  return apiRequest(`${BASE_URL}/financial-transactions/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export const deleteTransaction = async (id: string) => {
  return apiRequest(`${BASE_URL}/financial-transactions/${id}`, {
    method: "DELETE",
  })
}

export const getAccountsPayable = async (filters: Record<string, string>): Promise<PaginatedResponse<AccountPayable>> => {
  const params = new URLSearchParams(filters)
  return apiRequest<PaginatedResponse<AccountPayable>>(`${BASE_URL}/accounts-payable?${params}`)
}

export const createAccountPayable = async (data: AccountPayableInput) => {
  return apiRequest(`${BASE_URL}/accounts-payable`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export const updateAccountPayable = async (id: string, data: AccountPayableInput) => {
  return apiRequest(`${BASE_URL}/accounts-payable/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export const deleteAccountPayable = async (id: string) => {
  return apiRequest(`${BASE_URL}/accounts-payable/${id}`, {
    method: "DELETE",
  })
}

export const updateAccountInstallment = async (id: string, status: string, paymentDate?: string | Date) => {
  return apiRequest(`${BASE_URL}/accounts-payable-installments/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status, paymentDate }),
  })
}

export const getDashboardMetrics = async (month?: number, year?: number) => {
  const params = new URLSearchParams()
  if (month) params.append("month", month.toString())
  if (year) params.append("year", year.toString())
  
  return apiRequest<{
    summary: {
      income: number;
      expense: number;
      balance: number;
    };
    payables: {
      overdue: number;
      overdueAmount: number;
      dueToday: number;
      dueTodayAmount: number;
      dueTomorrow: number;
      dueTomorrowAmount: number;
    };
    expensesByCategory: Array<{ category: string; amount: number }>;
  }>(`${BASE_URL}/dashboard/financial?${params}`)
}

export const addInstallmentAttachment = async (installmentId: string, data: { type: string; fileUrl: string; fileName: string }) => {
  return apiRequest(`${BASE_URL}/accounts-payable/installments/${installmentId}/attachments`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export const deleteInstallmentAttachment = async (installmentId: string, attachmentId: string) => {
  return apiRequest(`${BASE_URL}/accounts-payable/installments/${installmentId}/attachments/${attachmentId}`, {
    method: "DELETE",
  })
}

export const updateInstallmentAttachment = async (installmentId: string, attachmentId: string, type: string) => {
  return apiRequest(`${BASE_URL}/accounts-payable/installments/${installmentId}/attachments/${attachmentId}`, {
    method: "PATCH",
    body: JSON.stringify({ type }),
  })
}
