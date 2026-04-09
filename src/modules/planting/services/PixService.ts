import { QrCodePix } from "qrcode-pix"

export interface GeneratePixParams {
  key: string          // Chave Pix (CPF, e-mail, telefone, aleatória)
  name: string         // Nome do recebedor (máx 25 chars)
  city: string         // Cidade do recebedor (máx 15 chars)
  amount: number       // Valor em reais (ex: 123.45)
  txid: string         // ID único da transação (máx 25 chars, alfanumérico)
  message?: string     // Mensagem opcional
}

export interface PixResult {
  payload: string      // Código Pix copia e cola (EMV/BR Code)
  qrCode: string       // Imagem base64 do QR Code (usar em <img src={qrCode}>)
}

export class PixService {
  static async generate(params: GeneratePixParams): Promise<PixResult> {
    // Sanitize: txid allows only alphanumeric (max 25 chars per BACEN spec)
    const txid = params.txid
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 25) || "pagamento"

    // Name max 25 chars, city max 15 chars per spec
    const name = params.name.slice(0, 25)
    const city = params.city.slice(0, 15).toUpperCase()

    const qrCodePix = QrCodePix({
      version: "01",
      key: params.key,
      name,
      city,
      transactionId: txid,
      message: params.message,
      value: params.amount,
    })

    const payload = qrCodePix.payload()
    const qrCode = await qrCodePix.base64()

    return { payload, qrCode }
  }
}
