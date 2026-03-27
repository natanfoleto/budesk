import { ExpenseCategory, PaymentMethod } from "@prisma/client"

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  DINHEIRO: "Dinheiro",
  PIX: "PIX",
  CARTAO: "Cartão",
  BOLETO: "Boleto",
  CHEQUE: "Cheque",
  TRANSFERENCIA: "Transferência",
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  ALIMENTACAO: "Alimentação",
  COMBUSTIVEL: "Combustível",
  EQUIPAMENTOS: "Equipamentos",
  MANUTENCAO: "Manutenção",
  PECAS: "Peças",
  SALARIO: "Salário",
  SERVICOS: "Serviços",
  OUTROS: "Outros",
}
