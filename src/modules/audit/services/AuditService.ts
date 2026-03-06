import { AuditAction, Prisma, PrismaClient } from "@prisma/client"

export class AuditService {
  /**
   * Registra um Evento de Auditoria, podendo utilizar a transaction local ou o Prisma global.
   */
  static async logAction(
    tx: Prisma.TransactionClient | PrismaClient,
    action: AuditAction,
    entity: string,
    entityId: string | null,
    newData: Prisma.InputJsonValue | undefined,
    userId: string | null = null,
    oldData: Prisma.InputJsonValue | undefined = undefined
  ) {
    if (!tx) {
      throw new Error("AuditService requires a Prisma Client or Transaction object.")
    }
    
    await tx.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        newData,
        oldData,
        userId,
      }
    })
  }
}
