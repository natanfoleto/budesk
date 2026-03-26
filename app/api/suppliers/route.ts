import { Prisma } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"

import { createAuditLog } from "@/lib/audit"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "100")
    const name = searchParams.get("name")
    const document = searchParams.get("document")
    const city = searchParams.get("city")
    const active = searchParams.get("active")

    const skip = (page - 1) * limit

    const where: Prisma.SupplierWhereInput = {}

    if (name) {
      where.OR = [
        { name: { contains: name, mode: "insensitive" } },
        { tradeName: { contains: name, mode: "insensitive" } }
      ]
    }

    if (document) {
      where.document = { contains: document }
    }

    if (city) {
      where.city = { contains: city, mode: "insensitive" }
    }

    if (active === "true") {
      where.active = true
    } else if (active === "false") {
      where.active = false
    }

    const [total, suppliers] = await Promise.all([
      prisma.supplier.count({ where }),
      prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
      })
    ])

    return NextResponse.json({
      data: suppliers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao buscar fornecedores" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get("x-user-id")
  
  try {
    const body = await request.json()
    const { 
      name, tradeName, personType, document, stateRegistration, municipalRegistration,
      email, phone, mobile, contactName, zipCode, street, number, complement,
      neighborhood, city, state, bank, branch, account, accountType, pixKey, notes
    } = body

    if (!name) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
    }

    // Validation: Duplicate document
    const cleanDocument = document?.trim() || null
    if (cleanDocument) {
      const duplicateDocument = await prisma.supplier.findFirst({
        where: { document: cleanDocument }
      })

      if (duplicateDocument) {
        return NextResponse.json(
          { error: "Já existe um fornecedor cadastrado com este CPF/CNPJ" },
          { status: 400 }
        )
      }
    }

    const supplier = await prisma.supplier.create({
      data: {
        name,
        tradeName,
        personType,
        document: cleanDocument,
        stateRegistration,
        municipalRegistration,
        email,
        phone,
        mobile,
        contactName,
        zipCode,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        bank,
        branch,
        account,
        accountType,
        pixKey,
        notes,
        active: true
      }
    })

    // Audit
    if (userId) {
      await createAuditLog({
        action: "CREATE",
        entity: "Supplier",
        entityId: supplier.id,
        newData: supplier,
        userId: userId,
      })
    }

    return NextResponse.json(supplier, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao criar fornecedor" }, { status: 500 })
  }
}
