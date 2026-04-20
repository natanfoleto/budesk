import { NextRequest, NextResponse } from "next/server"

import { PixService } from "@/src/modules/planting/services/PixService"
import { PlantingParameterService } from "@/src/modules/planting/services/PlantingParameterService"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { amount, txid, key, keyType, name } = body as {
      amount: number
      txid: string
      key: string   // Chave Pix do funcionário
      keyType?: string // Tipo da chave (PIX_CPF, PIX_TELEFONE, etc)
      name: string  // Nome do funcionário
    }

    if (!amount || !txid || !key || !name) {
      return NextResponse.json(
        { error: "amount, txid, key e name são obrigatórios" },
        { status: 400 }
      )
    }

    // Only pix_city is global — key and name come from the frontend
    const pixCity =
      (await PlantingParameterService.getParameter("pix_city")) ||
      "Jaborandi"

    const result = await PixService.generate({
      key,
      keyType,
      name,
      city: pixCity,
      amount,
      txid,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Erro ao gerar QR Code Pix:", error)
    return NextResponse.json(
      { error: "Erro ao gerar QR Code Pix" },
      { status: 500 }
    )
  }
}
