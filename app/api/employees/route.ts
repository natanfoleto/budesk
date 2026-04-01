import { Prisma } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"

import { createAuditLog } from "@/lib/audit"
import prisma from "@/lib/prisma"

const AUDIT_Create = "CREATE"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "1000") // Default to large limit for now if not specified
    const name = searchParams.get("name")
    const role = searchParams.get("role")
    const document = searchParams.get("cpf")
    const status = searchParams.get("status") // "ATIVO", "ENCERRADO"
    const jobId = searchParams.get("jobId")
    const tagIds = searchParams.getAll("tagIds").filter(Boolean)

    const skip = (page - 1) * limit

    const where: Prisma.EmployeeWhereInput = {}

    if (name) {
      where.name = { contains: name, mode: "insensitive" }
    }

    if (tagIds && tagIds.length > 0) {
      where.tags = {
        some: {
          tagId: { in: tagIds }
        }
      }
    }

    if (jobId) {
      where.jobId = jobId
    } else if (role) {
      where.role = { contains: role, mode: "insensitive" }
    }

    if (document) {
      where.document = { contains: document }
    }

    if (status === "ATIVO") {
      where.OR = [
        {
          employmentRecords: {
            some: {
              terminationDate: null
            }
          }
        },
        {
          contracts: {
            some: {
              status: "ACTIVE"
            }
          }
        }
      ]
    } else if (status === "ENCERRADO") {
      where.AND = [
        {
          OR: [
            { employmentRecords: { none: { terminationDate: null } } },
            { employmentRecords: { none: {} } }
          ]
        },
        {
          OR: [
            { contracts: { none: { status: "ACTIVE" } } },
            { contracts: { none: {} } }
          ]
        }
      ]
    }

    const [total, employees] = await Promise.all([
      prisma.employee.count({ where }),
      prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
        include: {
          tags: {
            include: {
              tag: true
            }
          },
          employmentRecords: {
            orderBy: { admissionDate: "desc" },
            take: 1
          }
        }
      })
    ])

    const formattedEmployees = employees.map(emp => ({
      ...emp,
      tags: emp.tags.map(t => t.tag),
      terminationDate: emp.employmentRecords[0]?.terminationDate || null,
      admissionDate: emp.employmentRecords[0]?.admissionDate || null
    }))

    return NextResponse.json({
      data: formattedEmployees,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
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
      shirtSize, pantsSize, shoeSize, role, jobId
    } = body

    // Validation: Duplicate document
    if (document) {
      const existingEmployee = await prisma.employee.findUnique({
        where: { document }
      })

      if (existingEmployee) {
        return NextResponse.json(
          { error: "Já existe um funcionário cadastrado com este CPF/Documento" },
          { status: 400 }
        )
      }
    }

    const employee = await prisma.employee.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        document: document || null,
        rg: rg || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        gender,
        shirtSize: shirtSize || null,
        pantsSize,
        shoeSize,
        role,
        jobId: jobId || null,
        active: true
      },
      include: {
        job: true
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
