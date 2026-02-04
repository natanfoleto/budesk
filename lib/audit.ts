import { AuditAction } from "@prisma/client"

import prisma from "@/lib/prisma"

interface CreateAuditLogParams {
  action: AuditAction
  entity: string
  entityId: string
  oldData?: any
  newData?: any
  userId: string
}

export async function createAuditLog({
  action,
  entity,
  entityId,
  oldData,
  newData,
  userId,
}: CreateAuditLogParams) {
  try {
    // Tenta criar o log vinculando ao usuário
    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        oldData: oldData ? JSON.parse(JSON.stringify(oldData)) : undefined,
        newData: newData ? JSON.parse(JSON.stringify(newData)) : undefined,
        userId: userId,
      },
    })
  } catch (error: any) {
    // Se falhar por violação de chave estrangeira (usuário não existe), tenta criar sem usuário
    if (error.code === 'P2003') {
      console.warn(`Audit log creation failed for userId ${userId}. Retrying without user link.`)
      await prisma.auditLog.create({
        data: {
          action,
          entity,
          entityId,
          oldData: oldData ? JSON.parse(JSON.stringify(oldData)) : undefined,
          newData: newData ? JSON.parse(JSON.stringify(newData)) : undefined,
          userId: null, 
        },
      })
    } else {
      // Se for outro erro, relança (ou apenas loga para não quebrar o fluxo principal)
      console.error("Failed to create audit log:", error)
      // Não lançamos erro aqui para não impedir a operação principal de concluir
    }
  }
}
