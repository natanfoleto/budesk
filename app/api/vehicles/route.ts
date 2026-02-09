import { NextRequest, NextResponse } from "next/server"

import { createAuditLog } from "@/lib/audit"
import prisma from "@/lib/prisma"

const AUDIT_Action = "CREATE"

export async function GET() {
  try {
    const vehicles = await prisma.vehicle.findMany({
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(vehicles)
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
    const { 
      plate, model, brand, year, description, type
    } = body

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
        year: year ? parseInt(year) : null,
        description,
        type,
        active: true
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
    console.error(error)
    return NextResponse.json({ error: "Erro ao criar veículo" }, { status: 500 })
  }
}
