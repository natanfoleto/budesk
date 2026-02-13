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
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date))
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
