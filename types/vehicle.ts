export enum VehicleType {
  // Veículos leves
  CARRO = "CARRO",
  UTILITARIO = "UTILITARIO",
  CAMINHONETE = "CAMINHONETE",
  VAN = "VAN",
  SUV = "SUV",
  MOTO = "MOTO",

  // Transporte de passageiros
  ONIBUS = "ONIBUS",
  MICRO_ONIBUS = "MICRO_ONIBUS",

  // Caminhões
  CAMINHAO = "CAMINHAO",
  CAMINHAO_3_4 = "CAMINHAO_3_4",
  CAMINHAO_TOCO = "CAMINHAO_TOCO",
  CAMINHAO_TRUCK = "CAMINHAO_TRUCK",
  CARRETA = "CARRETA",
  BITREM = "BITREM",
  RODOTREM = "RODOTREM",

  // Máquinas pesadas
  MAQUINA = "MAQUINA",
  TRATOR = "TRATOR",
  RETROESCAVADEIRA = "RETROESCAVADEIRA",
  PA_CARREGADEIRA = "PA_CARREGADEIRA",
  ESCAVADEIRA = "ESCAVADEIRA",
  MOTONIVELADORA = "MOTONIVELADORA",
  ROLO_COMPACTADOR = "ROLO_COMPACTADOR",

  // Implementos e equipamentos rebocáveis
  REBOQUE = "REBOQUE",
  SEMIRREBOQUE = "SEMIRREBOQUE",
  PRANCHA = "PRANCHA",
  TANQUE = "TANQUE",

  // Agrícola
  COLHEITADEIRA = "COLHEITADEIRA",
  PULVERIZADOR = "PULVERIZADOR",

  // Outros
  EMPILHADEIRA = "EMPILHADEIRA",
  OUTRO = "OUTRO",
}

export const VehicleTypeLabels: Record<VehicleType, string> = {
  [VehicleType.CARRO]: "Carro",
  [VehicleType.UTILITARIO]: "Utilitário",
  [VehicleType.CAMINHONETE]: "Caminhonete",
  [VehicleType.VAN]: "Van",
  [VehicleType.SUV]: "SUV",
  [VehicleType.MOTO]: "Moto",
  [VehicleType.ONIBUS]: "Ônibus",
  [VehicleType.MICRO_ONIBUS]: "Micro-ônibus",
  [VehicleType.CAMINHAO]: "Caminhão",
  [VehicleType.CAMINHAO_3_4]: "Caminhão 3/4",
  [VehicleType.CAMINHAO_TOCO]: "Caminhão Toco",
  [VehicleType.CAMINHAO_TRUCK]: "Caminhão Truck",
  [VehicleType.CARRETA]: "Carreta",
  [VehicleType.BITREM]: "Bitrem",
  [VehicleType.RODOTREM]: "Rodotrem",
  [VehicleType.MAQUINA]: "Máquina",
  [VehicleType.TRATOR]: "Trator",
  [VehicleType.RETROESCAVADEIRA]: "Retroescavadeira",
  [VehicleType.PA_CARREGADEIRA]: "Pá Carregadeira",
  [VehicleType.ESCAVADEIRA]: "Escavadeira",
  [VehicleType.MOTONIVELADORA]: "Motoniveladora",
  [VehicleType.ROLO_COMPACTADOR]: "Rolo Compactador",
  [VehicleType.REBOQUE]: "Reboque",
  [VehicleType.SEMIRREBOQUE]: "Semirreboque",
  [VehicleType.PRANCHA]: "Prancha",
  [VehicleType.TANQUE]: "Tanque",
  [VehicleType.COLHEITADEIRA]: "Colheitadeira",
  [VehicleType.PULVERIZADOR]: "Pulverizador",
  [VehicleType.EMPILHADEIRA]: "Empilhadeira",
  [VehicleType.OUTRO]: "Outro",
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
