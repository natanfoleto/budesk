import prisma from "@/lib/prisma"

export class PlantingParameterService {
  static async getParameter(key: string, db = prisma): Promise<string | null> {
    const param = await db.plantingParameter.findUnique({
      where: { key }
    })
    return param?.value || null
  }

  static async setParameter(key: string, value: string, description?: string, db = prisma) {
    return db.plantingParameter.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description }
    })
  }

  static async getAllParameters(db = prisma) {
    return db.plantingParameter.findMany()
  }

  static async getMultipleParameters(keys: string[], db = prisma) {
    const params = await db.plantingParameter.findMany({
      where: { key: { in: keys } }
    })
    return params.reduce((acc, param) => {
      acc[param.key] = param.value
      return acc
    }, {} as Record<string, string>)
  }
}
