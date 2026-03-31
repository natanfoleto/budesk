import * as z from "zod"

import { VehicleOwnership, VehicleType } from "@/types/vehicle"

export const vehicleSchema = z.object({
  plate: z.string().min(1, "Placa é obrigatória").toUpperCase(),
  nickname: z.string().optional(),
  model: z.string().optional(),
  brand: z.string().optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional().nullable(),
  description: z.string().optional(),
  color: z.string().optional(),
  type: z.nativeEnum(VehicleType, {
    message: "Selecione um tipo válido",
  }),
  ownership: z.nativeEnum(VehicleOwnership).default(VehicleOwnership.EMPRESA),
  ownerName: z.string().optional(),
  documentUrl: z.string().optional().nullable(),
  active: z.boolean().default(true),
})

export type VehicleFormData = z.infer<typeof vehicleSchema>
