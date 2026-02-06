
import { UserRole } from "@prisma/client"
import { hash } from "bcryptjs"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { createAuditLog } from "@/lib/audit"
import prisma from "@/lib/prisma"

const userSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres").optional(),
  role: z.enum(["ROOT", "ADMIN", "EMPLOYEE"]),
  active: z.boolean().optional().default(true),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")
    
    // Filter by role if provided
    const where = role ? { role: role as UserRole } : {} // Type casting for convenience, validated by usage logic if strict

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        // Exclude password
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Erro ao buscar usuários" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate body
    const validation = userSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.format() },
        { status: 400 }
      )
    }

    const { name, email, password, role, active } = validation.data

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "E-mail já cadastrado" },
        { status: 409 }
      )
    }

    // Default password if not provided (should be handled by frontend or policy)
    // Assuming required for new user creation unless specified
    const finalPassword = password || "budesk123" 
    const hashedPassword = await hash(finalPassword, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        active,
      },
    })

    // Remove password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user

    // Audit Log
    await createAuditLog({
      action: "CREATE",
      entity: "User",
      entityId: user.id,
      newData: userWithoutPassword,
      userId,
    })

    return NextResponse.json(userWithoutPassword, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Erro ao criar usuário" }, { status: 500 })
  }
}
