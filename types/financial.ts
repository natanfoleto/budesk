export type TransactionType = "ENTRADA" | "SAIDA"

export type PaymentMethod = "DINHEIRO" | "PIX" | "CARTAO" | "BOLETO" | "CHEQUE" | "TRANSFERENCIA"

export interface Transaction {
  id: string
  description: string
  amount: number
  type: TransactionType
  category: string
  paymentMethod: PaymentMethod
  date: string | Date
  createdAt: string | Date
  updatedAt: string | Date
}

export type AccountStatus = "PENDENTE" | "PAGA" | "ATRASADA"

export interface AccountPayable {
  id: string
  description: string
  amount: number
  dueDate: string | Date
  status: AccountStatus
  supplier?: {
    id: string
    name: string
  } | null
  createdAt: string | Date
  updatedAt: string | Date
}
