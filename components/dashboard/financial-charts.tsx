"use client"

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

interface FinancialChartsProps {
  expensesByCategory: { category: string; amount: number }[]
}

export function FinancialCharts({ expensesByCategory }: FinancialChartsProps) {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Despesas por Categoria</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={expensesByCategory}>
            <XAxis
              dataKey="category"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `R$${value}`}
            />
            <Tooltip 
              formatter={(value: number) => formatCurrency(value)}
              cursor={{ fill: 'transparent' }}
            />
            <Bar dataKey="amount" fill="#adfa1d" radius={[4, 4, 0, 0]} name="Valor" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
