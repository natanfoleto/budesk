"use client"

import { AlertCircle, DollarSign } from "lucide-react"

import { FinancialCharts } from "@/components/dashboard/financial-charts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDashboardMetrics } from "@/hooks/use-financial"
import { formatCurrency } from "@/lib/utils"

export default function FinancialDashboardPage() {
  const { data, isLoading } = useDashboardMetrics()

  if (isLoading) {
    return <div className="p-8">Carregando dashboard...</div>
  }

  if (!data) {
    return <div className="p-8">Erro ao carregar dados.</div>
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard Financeiro</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.summary.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(data.summary.balance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Entradas: {formatCurrency(data.summary.income)} | Saídas: {formatCurrency(data.summary.expense)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas Atrasadas</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{data.payables.overdue}</div>
            <p className="text-xs text-muted-foreground">
              Total: {formatCurrency(data.payables.overdueAmount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencem Hoje</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{data.payables.dueToday}</div>
            <p className="text-xs text-muted-foreground">
              Total: {formatCurrency(data.payables.dueTodayAmount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencem Amanhã</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{data.payables.dueTomorrow}</div>
            <p className="text-xs text-muted-foreground">
              Total: {formatCurrency(data.payables.dueTomorrowAmount)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <FinancialCharts expensesByCategory={data.expensesByCategory} />
      </div>
    </div>
  )
}
