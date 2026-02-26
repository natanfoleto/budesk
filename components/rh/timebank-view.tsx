"use client"

import { Clock, TrendingDown, TrendingUp } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TimeBank } from "@/types/rh"

interface TimeBankViewProps {
  timeBanks: TimeBank[]
}

export function TimeBankView({ timeBanks }: TimeBankViewProps) {
  
  if (timeBanks.length === 0) {
    return (
      <div className="flex min-h-[150px] flex-col items-center justify-center rounded-md border border-dashed p-4 text-center animate-in fade-in-50 bg-background/50">
        <p className="text-sm text-muted-foreground">
            Nenhum saldo no banco de horas registrado.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {timeBanks.map((tb) => {
        const saldo = Number(tb.saldoHoras)
        const isPositive = saldo > 0
        const isNegative = saldo < 0

        return (
          <Card key={tb.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{tb.employee?.name || "N/A"}</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isPositive ? 'text-green-600' : isNegative ? 'text-destructive' : ''}`}>
                {saldo > 0 ? '+' : ''}{saldo.toFixed(1)}h
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  {Number(tb.horasCredito).toFixed(1)}h
                </div>
                <div className="flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-destructive" />
                  {Number(tb.horasDebito).toFixed(1)}h
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
