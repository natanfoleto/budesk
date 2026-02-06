
import { Prisma } from "@prisma/client"
import { hash } from "bcryptjs"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { createAuditLog } from "@/lib/audit"
import prisma from "@/lib/prisma"

const updateUserSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").optional(),
  email: z.string().email("E-mail inválido").optional(),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres").optional(),
  role: z.enum(["ROOT", "ADMIN", "EMPLOYEE"]).optional(),
  active: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Erro ao buscar usuário" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Validate body
    const validation = updateUserSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.format() },
        { status: 400 }
      )
    }

    const data = validation.data

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Prepare update data
    const updateData: Prisma.UserUpdateInput = { ...data }
    
    // Hash password if provided
    if (data.password) {
      updateData.password = await hash(data.password, 10)
    } else {
      delete (updateData as Prisma.UserUpdateInput).password
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    })

    // Remove password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = updatedUser
    // Remove password from old data logging if present
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: oldPassword, ...oldUserSafe } = existingUser

    // Audit Log
    await createAuditLog({
      action: "UPDATE",
      entity: "User",
      entityId: id,
      oldData: oldUserSafe,
      newData: userWithoutPassword,
      userId,
    })

    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Erro ao atualizar usuário" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    await prisma.user.delete({
      where: { id },
    })

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...oldUserSafe } = existingUser

    // Audit Log
    await createAuditLog({
      action: "DELETE",
      entity: "User",
      entityId: id,
      oldData: oldUserSafe, // Logging the deleted data
      userId,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Erro ao excluir usuário" }, { status: 500 })
  }
}
