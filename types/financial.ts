import { ExpenseCategory, PaymentMethod, TransactionType } from "@prisma/client"

export interface Transaction {
  id: string
  description: string
  valueInCents: number
  type: TransactionType
  category: ExpenseCategory
  paymentMethod: PaymentMethod | string
  date: string | Date
  createdAt?: string | Date
  updatedAt?: string | Date
  supplier?: { name: string } | null
  employee?: { name: string } | null
  service?: { title: string } | null
}

export type AccountStatus = "PENDENTE" | "PAGA" | "ATRASADA"

export interface AccountInstallment {
  id: string
  accountPayableId: string
  installmentNumber: number
  valueInCents: number
  dueDate: string | Date
  status: AccountStatus
  paymentDate?: string | Date | null
  createdAt?: string | Date
  updatedAt?: string | Date
}

export interface AccountPayable {
  id: string
  description: string
  paymentMethod: PaymentMethod | string
  totalValueInCents: number
  installmentsCount: number
  status?: AccountStatus // Calculated aggregate
  paidInstallmentsCount?: number // Calculated
  nextDueDate?: string | Date | null // Calculated earliest pending Vencimento
  supplier?: {
    id: string
    name: string
  } | null
  installments?: AccountInstallment[]
  createdAt?: string | Date
  updatedAt?: string | Date
}
