import { type ClassValue,clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (value: number | string | undefined) => {
  if (value === undefined || value === null) return "R$ 0,00"
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value) / 100)
}

export const formatDate = (date: string | Date | undefined) => {
  if (!date) return "-"
  return new Intl.DateTimeFormat("pt-BR").format(parseLocalDate(date))
}

export const formatCentsToReal = (cents: number | undefined | null) => {
  if (cents === undefined || cents === null) return "R$ 0,00"
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100)
}

export const parseCurrencyToCents = (value: string) => {
  if (!value) return 0
  const numbers = value.replace(/\D/g, "")
  return Number(numbers)
}

export const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1")
}

export const maskPhone = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{4})\d+?$/, "$1")
}

export const formatAccountIdentifier = (value: string | undefined | null) => {
  if (!value) return ""
  const cleanValue = value.replace(/\D/g, "")

  // CPF
  if (cleanValue.length === 11) {
    return maskCPF(cleanValue)
  }

  // CNPJ
  if (cleanValue.length === 14) {
    return cleanValue
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
  }

  // Phone (Landline or Cell)
  if (cleanValue.length === 10 || cleanValue.length === 11) {
    return maskPhone(cleanValue)
  }

  return value
}

export const parseLocalDate = (dateStr: string | Date | undefined) => {
  if (!dateStr) return new Date()
  
  // If it's a Date object, use its UTC components to avoid shift
  if (dateStr instanceof Date) {
    return new Date(dateStr.getUTCFullYear(), dateStr.getUTCMonth(), dateStr.getUTCDate())
  }

  // If it's a string, try to extract the YYYY-MM-DD part
  const dateMatch = typeof dateStr === "string" && dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (dateMatch) {
    return new Date(Number(dateMatch[1]), Number(dateMatch[2]) - 1, Number(dateMatch[3]))
  }
  
  // Fallback for other string formats: use UTC components of the parsed date
  const d = new Date(dateStr)
  if (!isNaN(d.getTime())) {
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  }

  return d
}
