import { AuditAction, Prisma, VehicleType } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"

import { vehicleSchema } from "@/components/fleet/vehicle-schema"
import { createAuditLog } from "@/lib/audit"
import prisma from "@/lib/prisma"

const AUDIT_Action = AuditAction.CREATE

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const plate = searchParams.get("plate")
  const brand = searchParams.get("brand")
  const year = searchParams.get("year")
  const type = searchParams.get("type")
  const active = searchParams.get("active")
  
  const page = Number(searchParams.get("page")) || 1
  const limit = Number(searchParams.get("limit")) || 10
  const skip = (page - 1) * limit

  try {
    const where: Prisma.VehicleWhereInput = {}

    if (plate) {
      where.plate = { contains: plate, mode: "insensitive" }
    }
    if (brand) {
      where.brand = { contains: brand, mode: "insensitive" }
    }
    if (year) {
      where.year = Number(year)
    }
    if (type) {
      where.type = type as VehicleType
    }
    if (active === "true") {
      where.active = true
    } else if (active === "false") {
      where.active = false
    }

    const [total, vehicles] = await Promise.all([
      prisma.vehicle.count({ where }),
      prisma.vehicle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      })
    ])

    return NextResponse.json({
      data: vehicles,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao buscar veículos" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get("x-user-id")
  if (!userId) {
    return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    
    // Validate body using Zod
    const validationResult = vehicleSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validationResult.error.format() },
        { status: 400 }
      )
    }

    const { 
      plate, model, brand, year, description, color, type, documentUrl, active
    } = validationResult.data

    const existingVehicle = await prisma.vehicle.findUnique({
      where: { plate }
    })

    if (existingVehicle) {
      return NextResponse.json({ error: "Já existe um veículo com esta placa" }, { status: 400 })
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        plate,
        model,
        brand,
        year,
        description,
        color,
        type,
        documentUrl,
        active
      }
    })

    await createAuditLog({
      action: AUDIT_Action,
      entity: "Vehicle",
      entityId: vehicle.id,
      newData: vehicle,
      userId: userId,
    })

    return NextResponse.json(vehicle, { status: 201 })
  } catch (error) {
    console.error("Error creating vehicle:", error)
    return NextResponse.json({ error: "Erro ao criar veículo" }, { status: 500 })
  }
}
