import { AccountPayable, Transaction } from "@/types/financial"

const BASE_URL = "/api"

export const getTransactions = async (filters: any): Promise<Transaction[]> => {
  const params = new URLSearchParams(filters)
  const res = await fetch(`${BASE_URL}/financial-transactions?${params}`)
  if (!res.ok) throw new Error("Erro ao buscar transações")
  return res.json()
}

export const createTransaction = async (data: any) => {
  const res = await fetch(`${BASE_URL}/financial-transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Erro ao criar transação")
  return res.json()
}

export const updateTransaction = async (id: string, data: any) => {
  const res = await fetch(`${BASE_URL}/financial-transactions/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Erro ao atualizar transação")
  return res.json()
}

export const deleteTransaction = async (id: string) => {
  const res = await fetch(`${BASE_URL}/financial-transactions/${id}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Erro ao excluir transação")
  return res.json()
}

export const getAccountsPayable = async (filters: any): Promise<AccountPayable[]> => {
  const params = new URLSearchParams(filters)
  const res = await fetch(`${BASE_URL}/accounts-payable?${params}`)
  if (!res.ok) throw new Error("Erro ao buscar contas")
  return res.json()
}

export const createAccountPayable = async (data: any) => {
  const res = await fetch(`${BASE_URL}/accounts-payable`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Erro ao criar conta")
  return res.json()
}

export const updateAccountPayable = async (id: string, data: any) => {
  const res = await fetch(`${BASE_URL}/accounts-payable/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Erro ao atualizar conta")
  return res.json()
}

export const deleteAccountPayable = async (id: string) => {
  const res = await fetch(`${BASE_URL}/accounts-payable/${id}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Erro ao excluir conta")
  return res.json()
}

export const getDashboardMetrics = async (month?: number, year?: number) => {
  const params = new URLSearchParams()
  if (month) params.append("month", month.toString())
  if (year) params.append("year", year.toString())
  
  const res = await fetch(`${BASE_URL}/dashboard/financial?${params}`)
  if (!res.ok) throw new Error("Erro ao buscar métricas")
  return res.json()
}
