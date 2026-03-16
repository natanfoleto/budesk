import { NextResponse } from "next/server"

import prisma from "@/lib/prisma"

export async function GET() {
  try {
    interface CategoryMapping {
      from: string
      to: string
    }

    const mappings: CategoryMapping[] = [
      { from: 'Alimentação', to: 'ALIMENTACAO' },
      { from: 'Combustível', to: 'COMBUSTIVEL' },
      { from: 'Equipamentos', to: 'EQUIPAMENTOS' },
      { from: 'Manutenção', to: 'MANUTENCAO' },
      { from: 'Peças', to: 'PECAS' },
      { from: 'Salário', to: 'SALARIO' },
      { from: 'Serviços', to: 'SERVICOS' },
      { from: 'Outros', to: 'OUTROS' },
      // Case variations
      { from: 'combustivel', to: 'COMBUSTIVEL' },
      { from: 'alimentação', to: 'ALIMENTACAO' },
      { from: 'serviços', to: 'SERVICOS' },
    ]

    interface FixResult {
      table: string
      mapping: CategoryMapping
      count: number
    }

    const results: FixResult[] = []

    for (const table of ['planting_expenses', 'financial_transactions']) {
      for (const mapping of mappings) {
        const count = await prisma.$executeRawUnsafe(
          `UPDATE "${table}" SET "category" = '${mapping.to}' WHERE "category" = '${mapping.from}'`
        )
        if (count > 0) {
          results.push({ table, mapping, count })
        }
      }
      
      // Also ensure everything not matched goes to OUTROS if it's currently a valid string but not in enum
      // This is safer to do via cast check if possible, but let's stick to simple ones first.
    }

    return NextResponse.json({ success: true, results })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
    console.error("Data fix error:", error)
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}
