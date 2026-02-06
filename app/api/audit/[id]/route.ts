
import { NextResponse } from "next/server"

import prisma from "@/lib/prisma"

export async function GET(
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const log = await prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    })

    if (!log) {
      return NextResponse.json({ error: "Log não encontrado" }, { status: 404 })
    }

    return NextResponse.json(log)
  } catch (error) {
    console.error("Error fetching audit log:", error)
    return NextResponse.json({ error: "Erro ao buscar log" }, { status: 500 })
  }
}
