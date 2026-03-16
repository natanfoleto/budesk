import { NextRequest, NextResponse } from "next/server"

import { createAuditLog } from "@/lib/audit"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { name: "asc" },
      where: { active: true }
    })
    return NextResponse.json(jobs)
  } catch (error) {
    console.error("GET /api/jobs error:", error)
    return NextResponse.json({ error: "Erro ao buscar cargos" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get("x-user-id")
  const userRole = request.headers.get("x-user-role")

  if (!userId) {
    return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 })
  }

  if (userRole !== "ROOT" && userRole !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado. Somente administradores podem criar cargos." }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ error: "Nome do cargo é obrigatório" }, { status: 400 })
    }

    const job = await prisma.job.create({
      data: {
        name,
        description,
        active: true
      }
    })

    await createAuditLog({
      action: "CREATE",
      entity: "Job",
      entityId: job.id,
      newData: job,
      userId: userId,
    })

    return NextResponse.json(job, { status: 201 })
  } catch (error) {
    console.error("POST /api/jobs error:", error)
    return NextResponse.json({ error: "Erro ao criar cargo" }, { status: 500 })
  }
}
