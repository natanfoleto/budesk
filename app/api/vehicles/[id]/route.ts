import { NextRequest, NextResponse } from "next/server"

import { createAuditLog } from "@/lib/audit"
import prisma from "@/lib/prisma"

const AUDIT_UPDATE = "UPDATE"
const AUDIT_DELETE = "DELETE"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: params.id },
    })

    if (!vehicle) {
      return NextResponse.json({ error: "Veículo não encontrado" }, { status: 404 })
    }

    return NextResponse.json(vehicle)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao buscar veículo" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = request.headers.get("x-user-id")
  if (!userId) {
    return NextResponse.json({ error: "Usuário não identificado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { 
      plate, model, brand, year, description, type, active
    } = body

    const currentVehicle = await prisma.vehicle.findUnique({
      where: { id: params.id },
    })

    if (!currentVehicle) {
      return NextResponse.json({ error: "Veículo não encontrado" }, { status: 404 })
    }

    // Check if plate is being changed and if it's already taken
    if (plate !== currentVehicle.plate) {
      const existingVehicle = await prisma.vehicle.findUnique({
        where: { plate }
      })
      if (existingVehicle) {
        return NextResponse.json({ error: "Já existe um veículo com esta placa" }, { status: 400 })
      }
    }

    const vehicle = await prisma.vehicle.update({
      where: { id: params.id },
      data: {
        plate,
        model,
        brand,
        year: year ? parseInt(year) : null,
        description,
        type,
        active: active !== undefined ? active : currentVehicle.active
      }
    })

    await createAuditLog({
      action: AUDIT_UPDATE,
      entity: "Vehicle",
      entityId: vehicle.id,
      oldData: currentVehicle,
      newData: vehicle,
      userId: userId,
    })

    return NextResponse.json(vehicle)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao atualizar veículo" }, { status: 500 })
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
    const currentVehicle = await prisma.vehicle.findUnique({
      where: { id: params.id },
    })

    if (!currentVehicle) {
      return NextResponse.json({ error: "Veículo não encontrado" }, { status: 404 })
    }

    await prisma.vehicle.delete({
      where: { id: params.id },
    })

    await createAuditLog({
      action: AUDIT_DELETE,
      entity: "Vehicle",
      entityId: params.id,
      oldData: currentVehicle,
      userId: userId,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    // Check for foreign key constraint violation
    if ((error as { code?: string }).code === 'P2003') {
      return NextResponse.json({ error: "Não é possível excluir este veículo pois ele possui registros vinculados." }, { status: 400 })
    }
    return NextResponse.json({ error: "Erro ao excluir veículo" }, { status: 500 })
  }
}
