export enum VehicleType {
  CAMINHAO = "CAMINHAO",
  ONIBUS = "ONIBUS",
  MAQUINA = "MAQUINA",
  OUTRO = "OUTRO",
}
export interface Vehicle {
  id: string
  plate: string
  model: string | null
  brand: string | null
  year: number | null
  description: string | null
  type: VehicleType
  active: boolean
  createdAt: string | Date
}
