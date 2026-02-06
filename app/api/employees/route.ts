import { NextRequest, NextResponse } from "next/server"

import { createAuditLog } from "@/lib/audit"
import prisma from "@/lib/prisma"

const AUDIT_Create = "CREATE"

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { name: "asc" },
    })
    return NextResponse.json(employees)
  } catch (error) {
    console.log(error)
    
    return NextResponse.json({ error: "Erro ao buscar funcionários" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get("x-user-id")
  if (!userId) {
    return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { 
      name, email, phone, document, rg, birthDate, gender, 
      shirtSize, pantsSize, shoeSize, role, salaryInCents 
    } = body

    const employee = await prisma.employee.create({
      data: {
        name,
        email,
        phone,
        document,
        rg,
        birthDate: birthDate ? new Date(birthDate) : null,
        gender,
        shirtSize: shirtSize || null,
        pantsSize,
        shoeSize,
        role,
        salaryInCents,
        active: true
      }
    })

    // Create User for Employee if email exists
    if (email) {
      const existingUser = await prisma.user.findUnique({ where: { email } })
      
      if (!existingUser) {
        // Default password hash for 'budesk123'
        // In a real app, you might want to generate a random password or trigger an invite flow
        const hashedPassword = await import('bcryptjs').then(bcrypt => bcrypt.hash('budesk123', 10))
        
        await prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role: "EMPLOYEE", // Using string literal as enum is updated in schema but maybe not in code types yet fully if not regenerated? best to use UserRole.EMPLOYEE if imported. 
            // Better to rely on type safety if possible. Let's try string "EMPLOYEE" as Prisma enums match strings. 
            // Re-reading seed.ts using UserRole.ADMIN, so I should use UserRole.EMPLOYEE from @prisma/client if imported.
            // But I need to import it first or use string if compatible. I'll stick to string "EMPLOYEE" cast as UserRole or let prisma handle it.
            active: true,
          }
        })
      }
    }

    // Audit
    await createAuditLog({
      action: AUDIT_Create,
      entity: "Employee",
      entityId: employee.id,
      newData: employee,
      userId: userId,
    })

    return NextResponse.json(employee, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao criar funcionário" }, { status: 500 })
  }
}
