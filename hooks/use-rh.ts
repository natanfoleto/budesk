import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import * as rhService from "@/lib/services/rh"
import {
  AttendanceFormData,
  RHPaymentFormData,
  ThirteenthFormData,
  ThirteenthSalary,
  VacationFormData,
} from "@/types/rh"

// ======================== PAYMENTS ========================

export function useRHPayments(filters: Record<string, string>) {
  return useQuery({
    queryKey: ["rh-payments", filters],
    queryFn: () => rhService.getRHPayments(filters),
  })
}

export function useCreateRHPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: RHPaymentFormData) => rhService.createRHPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rh-payments"] })
      toast.success("Pagamento salvo com sucesso")
    },
    onError: () => toast.error("Erro ao salvar pagamento"),
  })
}

export function useUpdateRHPayment(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<RHPaymentFormData>) => rhService.updateRHPayment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rh-payments"] })
      queryClient.invalidateQueries({ queryKey: ["financial-transactions"] }) // Invalidate cash flow too
      toast.success("Pagamento atualizado com sucesso")
    },
    onError: () => toast.error("Erro ao atualizar pagamento"),
  })
}

export function useDeleteRHPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => rhService.deleteRHPayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rh-payments"] })
      queryClient.invalidateQueries({ queryKey: ["financial-transactions"] })
      toast.success("Pagamento excluído com sucesso")
    },
    onError: () => toast.error("Erro ao excluir pagamento"),
  })
}

// ======================== VACATIONS ========================

export function useVacations(employeeId?: string) {
  return useQuery({
    queryKey: ["rh-vacations", employeeId],
    queryFn: () => rhService.getVacations(employeeId),
  })
}

export function useCreateVacation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: VacationFormData) => rhService.createVacation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rh-vacations"] })
      toast.success("Férias cadastradas com sucesso")
    },
    onError: () => toast.error("Erro ao cadastrar férias"),
  })
}

export function useUpdateVacation(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<VacationFormData>) => rhService.updateVacation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rh-vacations"] })
      queryClient.invalidateQueries({ queryKey: ["rh-payments"] })
      queryClient.invalidateQueries({ queryKey: ["financial-transactions"] })
      toast.success("Férias atualizadas com sucesso")
    },
    onError: () => toast.error("Erro ao atualizar férias"),
  })
}

export function useDeleteVacation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => rhService.deleteVacation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rh-vacations"] })
      toast.success("Férias excluídas com sucesso")
    },
    onError: () => toast.error("Erro ao excluir férias"),
  })
}

// ======================== THIRTEENTH ========================

export function useThirteenths(employeeId?: string) {
  return useQuery({
    queryKey: ["rh-thirteenth", employeeId],
    queryFn: () => rhService.getThirteenths(employeeId),
  })
}

export function useCreateThirteenth() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ThirteenthFormData) => rhService.createThirteenth(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rh-thirteenth"] })
      toast.success("13º Salário gerado com sucesso")
    },
    onError: () => toast.error("Erro ao gerar 13º salário"),
  })
}

export function useUpdateThirteenth(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<ThirteenthSalary>) => rhService.updateThirteenth(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rh-thirteenth"] })
      queryClient.invalidateQueries({ queryKey: ["rh-payments"] })
      queryClient.invalidateQueries({ queryKey: ["financial-transactions"] })
      toast.success("13º Salário atualizado com sucesso")
    },
    onError: () => toast.error("Erro ao atualizar 13º salário"),
  })
}

export function useDeleteThirteenth() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => rhService.deleteThirteenth(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rh-thirteenth"] })
      toast.success("13º Salário excluído com sucesso")
    },
    onError: () => toast.error("Erro ao excluir 13º salário"),
  })
}

// ======================== ATTENDANCE ========================

export function useAttendance(filters: { employeeId?: string; month?: string }) {
  return useQuery({
    queryKey: ["rh-attendance", filters],
    queryFn: () => rhService.getAttendance(filters),
  })
}

export function useCreateAttendance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AttendanceFormData) => rhService.createAttendance(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rh-attendance"] })
      toast.success("Registro de frequência salvo com sucesso")
    },
    onError: () => toast.error("Erro ao salvar registro de frequência"),
  })
}

// ======================== TIME BANK ========================

export function useTimeBanks(employeeId?: string) {
  return useQuery({
    queryKey: ["rh-timebank", employeeId],
    queryFn: () => rhService.getTimeBanks(employeeId),
  })
}

export function useUpdateTimeBank() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { employeeId: string; horasCredito?: number; horasDebito?: number }) => 
      rhService.updateTimeBank(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rh-timebank"] })
      toast.success("Banco de horas atualizado com sucesso")
    },
    onError: () => toast.error("Erro ao atualizar banco de horas"),
  })
}

// ======================== REPORTS ========================

export function useRHReportMonthlyCost(year: string) {
  return useQuery({
    queryKey: ["rh-reports-monthly", year],
    queryFn: () => rhService.getMonthlyCostReport(year),
  })
}

export function useRHReportEmployeeCost(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["rh-reports-employee", startDate, endDate],
    queryFn: () => rhService.getEmployeeCostReport(startDate, endDate),
  })
}
