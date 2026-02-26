"use client"

import { ReportsView } from "@/components/rh/reports-view"

export default function ReportsPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Relatórios de RH</h2>
      </div>
      
      <p className="text-muted-foreground mb-8">
        Analise o custo total com funcionários: salários, férias, 13º, diárias e encargos vinculados.
      </p>

      <ReportsView />
    </div>
  )
}
