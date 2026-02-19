
import { NextResponse } from "next/server"

import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(suppliers)
  } catch (error) {
    console.error("Error fetching suppliers:", error)
    return NextResponse.json({ error: "Erro ao buscar fornecedores" }, { status: 500 })
  }
}
