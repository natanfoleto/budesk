export type TransactionType = "ENTRADA" | "SAIDA"

export type PaymentMethod = "DINHEIRO" | "PIX" | "CARTAO" | "BOLETO" | "CHEQUE" | "TRANSFERENCIA"

export interface Transaction {
  id: string
  description: string
  amount: number | string // Allow string for inputs or loose API returns, though number is preferred
  type: TransactionType
  category: string
  paymentMethod: PaymentMethod | string // Allow string if API return isn't strict yet
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
  amount: number | string
  dueDate: string | Date
  status: AccountStatus
  supplier?: {
    id: string
    name: string
  } | null
  createdAt?: string | Date
  updatedAt?: string | Date
}
