// RH Module Types

export type RHPaymentStatus = "SIMULADO" | "PENDENTE" | "PAGO" | "CANCELADO"
export type RHPaymentType =
  | "SALARIO"
  | "DIARIA"
  | "COMISSAO"
  | "BONUS"
  | "RESCISAO"
  | "FERIAS"
  | "DECIMO_TERCEIRO"
export type VacationStatus = "PREVISTA" | "APROVADA" | "GOZADA" | "PAGA"
export type ThirteenthStatus = "PENDENTE" | "PARCIAL" | "PAGO"
export type AttendanceType = "PRESENCA" | "FALTA" | "FALTA_JUSTIFICADA" | "ATESTADO"

export interface RHPayment {
  id: string
  employeeId: string
  competencia: string
  tipoPagamento: RHPaymentType
  salarioBase: number
  adicionais: number
  horasExtras: number
  valorHorasExtras: number
  descontos: number
  valorAdiantamentos: number
  totalBruto: number
  totalLiquido: number
  status: RHPaymentStatus
  dataPagamento?: string | null
  formaPagamento?: string | null
  centroCusto?: string | null
  observacoes?: string | null
  createdAt: string
  updatedAt: string
  employee?: { id: string; name: string; role?: string | null }
  encargos?: EmployerContribution | null
}

export interface RHPaymentFormData {
  employeeId: string
  competencia: string
  tipoPagamento: RHPaymentType
  salarioBase: number
  adicionais: number
  horasExtras: number
  valorHorasExtras: number
  descontos: number
  valorAdiantamentos: number
  status: RHPaymentStatus
  dataPagamento?: string
  formaPagamento?: string
  centroCusto?: string
  observacoes?: string
}

export interface SalaryHistory {
  id: string
  employeeId: string
  salarioAnterior: number
  novoSalario: number
  percentualAumento: number
  motivo?: string | null
  dataVigencia: string
  createdAt: string
  employee?: { id: string; name: string }
}

export interface Vacation {
  id: string
  employeeId: string
  periodoAquisitivoInicio: string
  periodoAquisitivoFim: string
  diasDireito: number
  diasUtilizados: number
  dataInicio?: string | null
  dataFim?: string | null
  valorFerias?: number | null
  adicionalUmTerco?: number | null
  status: VacationStatus
  createdAt: string
  updatedAt: string
  employee?: { id: string; name: string }
}

export interface VacationFormData {
  employeeId: string
  periodoAquisitivoInicio: string
  periodoAquisitivoFim: string
  diasDireito: number
  diasUtilizados: number
  dataInicio?: string
  dataFim?: string
  valorFerias?: number
  status: VacationStatus
}

export interface ThirteenthSalary {
  id: string
  employeeId: string
  anoReferencia: number
  mesesTrabalhados: number
  valorTotal: number
  primeiraParcela?: number | null
  segundaParcela?: number | null
  primeiraPaga: boolean
  segundaPaga: boolean
  status: ThirteenthStatus
  createdAt: string
  updatedAt: string
  employee?: { id: string; name: string }
}

export interface ThirteenthFormData {
  employeeId: string
  anoReferencia: number
  mesesTrabalhados: number
}

export interface TimeBank {
  id: string
  employeeId: string
  saldoHoras: number
  horasCredito: number
  horasDebito: number
  updatedAt: string
  employee?: { id: string; name: string }
}

export interface AttendanceRecord {
  id: string
  employeeId: string
  data: string
  tipo: AttendanceType
  horasTrabalhadas?: number | null
  horasExtras?: number | null
  bancoHorasImpacto?: number | null
  observacao?: string | null
  createdAt: string
  updatedAt: string
  employee?: { id: string; name: string }
}

export interface AttendanceFormData {
  employeeId: string
  data: string
  tipo: AttendanceType
  horasTrabalhadas?: number
  horasExtras?: number
  bancoHorasImpacto?: number
  observacao?: string
}

export interface EmployerContribution {
  id: string
  pagamentoId: string
  inssEmpresa: number
  fgts: number
  outrosEncargos: number
  totalEncargosEmpresa: number
  transactionId?: string | null
  createdAt: string
}

export interface RHReportMonthlyCost {
  competencia: string
  totalPagamentos: number
  totalLiquido: number
  totalEncargos: number
  totalGeral: number
  qtdFuncionarios: number
}

export interface RHReportEmployeeCost {
  employeeId: string
  employeeName: string
  totalLiquido: number
  totalEncargos: number
  totalGeral: number
  qtdPagamentos: number
}
