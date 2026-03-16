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

export interface AccountPayable {
  id: string
  description: string
  valueInCents: number
  dueDate: string | Date
  status: AccountStatus
  supplier?: {
    id: string
    name: string
  } | null
  createdAt?: string | Date
  updatedAt?: string | Date
}
