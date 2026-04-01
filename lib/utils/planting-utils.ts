import { endOfMonth, isAfter, parseISO, startOfDay, startOfMonth } from "date-fns"

/**
 * Checks if an employee is active on a specific date.
 * Active means the terminationDate is null or the date is on or before the terminationDate.
 */
export function isEmployeeActiveAtDate(date: string | Date, terminationDate?: string | Date | null): boolean {
  if (!terminationDate) return true
  
  const targetDate = startOfDay(typeof date === "string" ? parseISO(date) : date)
  const termDate = startOfDay(typeof terminationDate === "string" ? parseISO(terminationDate) : terminationDate)
  
  return !isAfter(targetDate, termDate)
}

/**
 * Checks if an employee should be visible in a given month.
 * Visible if terminationDate is null or terminationDate is in the SAME month or a FUTURE month.
 */
export function shouldShowEmployeeInMonth(monthDate: string | Date, terminationDate?: string | Date | null): boolean {
  if (!terminationDate) return true
  
  const targetMonthStart = startOfMonth(typeof monthDate === "string" ? parseISO(monthDate) : monthDate)
  const termDate = typeof terminationDate === "string" ? parseISO(terminationDate) : terminationDate
  const termMonthEnd = endOfMonth(termDate)
  
  // Show if the month we are looking at is before or same as the month of termination
  return !isAfter(targetMonthStart, termMonthEnd)
}
/**
 * Checks if a target date is before the employee's admission date.
 */
export function isBeforeAdmission(date: string | Date, admissionDate?: string | Date | null): boolean {
  if (!admissionDate) return false
  
  // Normalizar ambas as datas para o formato YYYY-MM-DD para comparação de string pura
  // Isso evita problemas de fuso horário que podem ocorrer com startOfDay
  const d1 = typeof date === "string" ? date.split("T")[0] : date.toISOString().split("T")[0]
  const d2 = typeof admissionDate === "string" ? admissionDate.split("T")[0] : admissionDate.toISOString().split("T")[0]
  
  // Retorna true se a data alvo for estritamente anterior à data de admissão
  return d1 < d2
}
