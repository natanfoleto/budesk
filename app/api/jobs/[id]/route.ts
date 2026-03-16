import { NextRequest, NextResponse } from "next/server"

import { createAuditLog } from "@/lib/audit"
import prisma from "@/lib/prisma"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = request.headers.get("x-user-id")
  if (!userId) {
    return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 })
  }

  try {
    const { id } = params
    const body = await request.json()
    const { name, description, active } = body

    const oldJob = await prisma.job.findUnique({ where: { id } })
    if (!oldJob) {
      return NextResponse.json({ error: "Cargo não encontrado" }, { status: 404 })
    }

    const job = await prisma.job.update({
      where: { id },
      data: {
        name,
        description,
        active
      }
    })

    await createAuditLog({
      action: "UPDATE",
      entity: "Job",
      entityId: job.id,
      oldData: oldJob,
      newData: job,
      userId: userId,
    })

    return NextResponse.json(job)
  } catch (error) {
    console.error(`PATCH /api/jobs/${params.id} error:`, error)
    return NextResponse.json({ error: "Erro ao atualizar cargo" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = request.headers.get("x-user-id")
  if (!userId) {
    return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 })
  }

  try {
    const { id } = params

    const oldJob = await prisma.job.findUnique({ where: { id } })
    if (!oldJob) {
      return NextResponse.json({ error: "Cargo não encontrado" }, { status: 404 })
    }

    // Checking if there are employees linked to this job
    const employeesCount = await prisma.employee.count({ where: { jobId: id } })
    if (employeesCount > 0) {
      // Soft delete instead of hard delete if there are employees linked
      const job = await prisma.job.update({
        where: { id },
        data: { active: false }
      })

      await createAuditLog({
        action: "DELETE",
        entity: "Job",
        entityId: id,
        oldData: oldJob,
        newData: job,
        userId: userId,
      })

      return NextResponse.json({ message: "Cargo desativado (existem funcionários vinculados)" })
    }

    await prisma.job.delete({ where: { id } })

    await createAuditLog({
      action: "DELETE",
      entity: "Job",
      entityId: id,
      oldData: oldJob,
      userId: userId,
    })

    return NextResponse.json({ message: "Cargo excluído com sucesso" })
  } catch (error) {
    console.error(`DELETE /api/jobs/${params.id} error:`, error)
    return NextResponse.json({ error: "Erro ao excluir cargo" }, { status: 500 })
  }
}
