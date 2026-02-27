"use client"

import { Download } from "lucide-react"
import { useState } from "react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useRHReportEmployeeCost, useRHReportMonthlyCost } from "@/hooks/use-rh"
import { formatCurrency } from "@/lib/utils"

export function ReportsView() {
  const [year, setYear] = useState(new Date().getFullYear().toString())
  
  const { data: monthlyData } = useRHReportMonthlyCost(year)
  const { data: employeeData } = useRHReportEmployeeCost(
    `${year}-01-01`, 
    `${year}-12-31`
  )

  const handleExportCSV = () => {
    if (!monthlyData) return
    const headers = ["Competencia", "QtdFuncionarios", "TotalLiquido", "TotalEncargos", "TotalGeral"]
    const rows = monthlyData.map(d => [
      d.competencia, 
      d.qtdFuncionarios, 
      d.totalLiquido.toFixed(2), 
      d.totalEncargos.toFixed(2), 
      d.totalGeral.toFixed(2)
    ])
    
    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.join(","))
    ].join("\n")
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `Custo_Mensal_${year}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Prepara dados para o grafico revertendo ordem cronologica
  const chartData = [...(monthlyData || [])].reverse().map(d => ({
    name: d.competencia,
    FolhaLiquida: d.totalLiquido,
    Encargos: d.totalEncargos,
  }))

  return (
    <div className="space-y-8">
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-bold">Resumo Anual Consolidado</h3>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={(new Date().getFullYear() - 1).toString()}>{new Date().getFullYear() - 1}</SelectItem>
              <SelectItem value={new Date().getFullYear().toString()}>{new Date().getFullYear()}</SelectItem>
              <SelectItem value={(new Date().getFullYear() + 1).toString()}>{new Date().getFullYear() + 1}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={handleExportCSV}>
          <Download className="h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Custo Geral Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => `R$${value/1000}k`}
                    />
                    <Tooltip 
                      formatter={(value: number | string | undefined) => formatCurrency(Number(value) || 0)}
                      cursor={{fill: 'transparent'}}
                    />
                    <Legend />
                    <Bar dataKey="FolhaLiquida" name="Folha Líquida" stackId="a" fill="#16a34a" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="Encargos" name="Encargos" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                 Nenhum dado para o ano selecionado.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalhamento por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[300px] overflow-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Competência</TableHead>
                    <TableHead>Líquido</TableHead>
                    <TableHead>Encargos</TableHead>
                    <TableHead>Total (R$)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyData?.map(row => (
                    <TableRow key={row.competencia}>
                      <TableCell className="font-medium">{row.competencia}</TableCell>
                      <TableCell className="text-green-600 font-medium">{formatCurrency(row.totalLiquido)}</TableCell>
                      <TableCell className="text-blue-600 font-medium">{formatCurrency(row.totalEncargos)}</TableCell>
                      <TableCell className="font-bold">{formatCurrency(row.totalGeral)}</TableCell>
                    </TableRow>
                  ))}
                  {!monthlyData?.length && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground p-4">
                        Sem registros.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Custo Total Acumulado por Funcionário no Ano</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Qtd. Pagamentos</TableHead>
                <TableHead>Folha Líquida Acumulada</TableHead>
                <TableHead>Encargos Acumulados</TableHead>
                <TableHead className="text-right">Custo Total (R$)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employeeData?.map(row => (
                <TableRow key={row.employeeId}>
                  <TableCell className="font-medium">{row.employeeName}</TableCell>
                  <TableCell>{row.qtdPagamentos}</TableCell>
                  <TableCell className="text-green-600">{formatCurrency(row.totalLiquido)}</TableCell>
                  <TableCell className="text-blue-600">{formatCurrency(row.totalEncargos)}</TableCell>
                  <TableCell className="font-bold text-right">{formatCurrency(row.totalGeral)}</TableCell>
                </TableRow>
              ))}
              {!employeeData?.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground p-4">
                      Nenhum custo registrado para funcionários este ano.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  )
}
