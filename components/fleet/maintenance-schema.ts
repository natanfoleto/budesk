import { PaymentMethod } from "@prisma/client"
import * as z from "zod"

export const MaintenanceType = {
  PREVENTIVA: "PREVENTIVA",
  CORRETIVA: "CORRETIVA",
  PREDITIVA: "PREDITIVA",
} as const

export const MaintenanceStatus = {
  PENDENTE: "PENDENTE",
  AGENDADA: "AGENDADA",
  REALIZADA: "REALIZADA",
  CANCELADA: "CANCELADA",
} as const

export const MaintenancePriority = {
  BAIXA: "BAIXA",
  MEDIA: "MEDIA",
  ALTA: "ALTA",
} as const

export const maintenanceSchema = z.object({
  type: z.nativeEnum(MaintenanceType),
  category: z.string().min(1, "Categoria é obrigatória"),
  description: z.string().min(1, "Descrição é obrigatória"),
  priority: z.nativeEnum(MaintenancePriority),
  
  scheduledDate: z.string().min(1, "Data programada é obrigatória"),
  completedDate: z.string().optional(),
  
  currentKm: z.number().nullable().optional(),
  
  isRecurrent: z.boolean().default(false),
  intervalKm: z.number().nullable().optional(),
  intervalDays: z.number().nullable().optional(),
  
  estimatedCost: z.number().min(0, "Custo estimado inválido"),
  finalCost: z.number().min(0, "Custo final inválido").optional().nullable(),
  costCenter: z.string().optional(),
  supplierId: z.string().optional(),
  invoiceNumber: z.string().optional(),
  
  status: z.nativeEnum(MaintenanceStatus),
  isPaid: z.boolean().default(false),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  
  internalNotes: z.string().optional(),
  approvalResponsible: z.string().optional(),
  operationalImpact: z.string().optional(),
  downtimeDays: z.number().min(0).optional().nullable(),
  attachments: z.string().optional(), // For now, just a text field for URLs or notes
})

export type MaintenanceFormData = z.infer<typeof maintenanceSchema>

export const MaintenanceTypeLabels = {
  [MaintenanceType.PREVENTIVA]: "Preventiva",
  [MaintenanceType.CORRETIVA]: "Corretiva",
  [MaintenanceType.PREDITIVA]: "Preditiva",
}

export const MaintenanceStatusLabels = {
  [MaintenanceStatus.PENDENTE]: "Pendente",
  [MaintenanceStatus.AGENDADA]: "Agendada",
  [MaintenanceStatus.REALIZADA]: "Realizada",
  [MaintenanceStatus.CANCELADA]: "Cancelada",
}

export const MaintenancePriorityLabels = {
  [MaintenancePriority.BAIXA]: "Baixa",
  [MaintenancePriority.MEDIA]: "Média",
  [MaintenancePriority.ALTA]: "Alta",
}
