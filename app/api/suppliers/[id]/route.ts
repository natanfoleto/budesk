import { NextRequest, NextResponse } from "next/server"

import { createAuditLog } from "@/lib/audit"
import prisma from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const supplier = await prisma.supplier.findUnique({
      where: { id },
    })

    if (!supplier) {
      return NextResponse.json({ error: "Fornecedor não encontrado" }, { status: 404 })
    }

    return NextResponse.json(supplier)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao buscar fornecedor" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = request.headers.get("x-user-id")
  
  try {
    const { id } = await params
    const body = await request.json()
    const { 
      name, tradeName, personType, document, stateRegistration, municipalRegistration,
      email, phone, mobile, contactName, zipCode, street, number, complement,
      neighborhood, city, state, bank, branch, account, accountType, pixKey, notes, active
    } = body

    const existingSupplier = await prisma.supplier.findUnique({
      where: { id },
    })

    if (!existingSupplier) {
      return NextResponse.json({ error: "Fornecedor não encontrado" }, { status: 404 })
    }

    // Validation: Duplicate document if changing
    const cleanDocument = document?.trim() || null
    if (cleanDocument && cleanDocument !== existingSupplier.document) {
      const duplicateDocument = await prisma.supplier.findUnique({
        where: { document: cleanDocument }
      })

      if (duplicateDocument) {
        return NextResponse.json(
          { error: "Já existe um fornecedor cadastrado com este CPF/CNPJ" },
          { status: 400 }
        )
      }
    }

    const updatedSupplier = await prisma.supplier.update({
      where: { id },
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
        active
      }
    })

    // Audit
    if (userId) {
      await createAuditLog({
        action: "UPDATE",
        entity: "Supplier",
        entityId: updatedSupplier.id,
        oldData: existingSupplier,
        newData: updatedSupplier,
        userId: userId,
      })
    }

    return NextResponse.json(updatedSupplier)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao atualizar fornecedor" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = request.headers.get("x-user-id")
  
  try {
    const { id } = await params
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            transactions: true,
            accounts: true,
            maintenances: true,
          }
        }
      }
    })

    if (!existingSupplier) {
      return NextResponse.json({ error: "Fornecedor não encontrado" }, { status: 404 })
    }

    const hasRelations = 
      existingSupplier._count.transactions > 0 ||
      existingSupplier._count.accounts > 0 ||
      existingSupplier._count.maintenances > 0

    if (hasRelations) {
      // Soft delete: just desativar
      const deletedSupplier = await prisma.supplier.update({
        where: { id },
        data: { active: false }
      })

      // Audit
      if (userId) {
        await createAuditLog({
          action: "DELETE",
          entity: "Supplier",
          entityId: deletedSupplier.id,
          oldData: existingSupplier,
          newData: deletedSupplier,
          userId: userId,
        })
      }

      return NextResponse.json({ message: "O fornecedor possui vínculos de negócios e foi apenas inativado." })
    }

    // Hard delete
    const deletedSupplier = await prisma.supplier.delete({
      where: { id }
    })

    // Audit
    if (userId) {
      await createAuditLog({
        action: "DELETE",
        entity: "Supplier",
        entityId: deletedSupplier.id,
        oldData: existingSupplier,
        newData: null,
        userId: userId,
      })
    }

    return NextResponse.json({ message: "Fornecedor excluído permanentemente com sucesso." })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao excluir fornecedor" }, { status: 500 })
  }
}
