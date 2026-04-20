import { QrCodePix } from "qrcode-pix"

export interface GeneratePixParams {
  key: string          // Chave Pix (CPF, e-mail, telefone, aleatória)
  keyType?: string     // Tipo da chave (PIX_CPF, PIX_TELEFONE, etc)
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
    // Para QR Code estático, o BACEN recomenda o uso de "***" quando não há txid gerado por API de PSP
    const txid = "***"

    const removeAccents = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")

    // Name max 25 chars, city max 15 chars per spec, no accents
    const name = removeAccents(params.name).slice(0, 25)
    const city = removeAccents(params.city).slice(0, 15).toUpperCase()

    // Formatar a chave corretamente (remover pontuação, adicionar +55 para telefone se precisar)
    let formattedKey = params.key
    if (params.keyType === "PIX_CPF" || params.keyType === "PIX_CNPJ") {
      formattedKey = formattedKey.replace(/\D/g, "")
    } else if (params.keyType === "PIX_TELEFONE") {
      formattedKey = formattedKey.replace(/\D/g, "")
      if (formattedKey.length === 10 || formattedKey.length === 11) {
        formattedKey = "+55" + formattedKey
      }
    } else if (!params.keyType) {
      const digits = formattedKey.replace(/\D/g, "")
      if (!formattedKey.includes("@") && !formattedKey.match(/[a-zA-Z]/)) {
        if (digits.length === 11 || digits.length === 10) {
          formattedKey = "+55" + digits // Possivelmente telefone se tiver 10 ou 11 (CPF tb tem 11, mas se não identificou, assume telefone por seguranca ou não... o ideal é enviar o type)
        } else {
          formattedKey = digits
        }
      }
    }

    const qrCodePix = QrCodePix({
      version: "01",
      key: formattedKey,
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
