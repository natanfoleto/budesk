import { Prisma, PrismaClient } from "@prisma/client"

import prisma from "@/lib/prisma"

export class TimeBankService {
  /**
   * Recalcula o Banco de Horas de um funcionário baseado em todos os seus registros de ponto.
   * Chamado sempre que um AttendanceRecord for criado, editado ou deletado.
   */
  static async syncTimeBank(tx: Prisma.TransactionClient | PrismaClient | undefined | null, employeeId: string) {
    const db = tx || prisma

    const records = await db.attendanceRecord.findMany({
      where: {
        employeeId,
        timeBankImpact: { not: null }
      }
    })

    let credit = 0
    let debit = 0

    for (const record of records) {
      const impact = Number(record.timeBankImpact)
      if (impact > 0) {
        credit += impact
      } else if (impact < 0) {
        debit += Math.abs(impact)
      }
    }

    const balance = credit - debit

    await db.timeBank.upsert({
      where: { employeeId },
      create: {
        employeeId,
        creditHours: credit,
        debitHours: debit,
        balanceHours: balance
      },
      update: {
        creditHours: credit,
        debitHours: debit,
        balanceHours: balance
      }
    })
  }
}
