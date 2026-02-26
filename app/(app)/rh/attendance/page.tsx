"use client"

import { Plus } from "lucide-react"
import { useState } from "react"

import { AttendanceForm } from "@/components/rh/attendance-form"
import { AttendanceTable } from "@/components/rh/attendance-table"
import { TimeBankView } from "@/components/rh/timebank-view"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  useAttendance,
  useCreateAttendance,
  useTimeBanks,
} from "@/hooks/use-rh"
import { AttendanceFormData } from "@/types/rh"

export default function AttendancePage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [monthFilter, setMonthFilter] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`)

  const { data: records } = useAttendance({ month: monthFilter })
  const { data: timeBanks } = useTimeBanks()
  
  const createMutation = useCreateAttendance()

  const handleOpenCreate = () => setIsFormOpen(true)

  const handleSubmit = (data: AttendanceFormData) => {
    createMutation.mutate(data, {
      onSuccess: () => setIsFormOpen(false),
    })
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      
      {/* Time Bank Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Banco de Horas</h2>
          <p className="text-sm text-muted-foreground mr-auto ml-4">Saldo geral por funcionário.</p>
        </div>
        <TimeBankView timeBanks={timeBanks || []} />
      </section>
      
      <hr />

      {/* Attendance Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Registro de Frequência</h2>
            <p className="text-sm text-muted-foreground">Listagem de faltas, presenças normais, atestados e horas extras.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="month-filter">Mês</Label>
              <Input
                id="month-filter"
                type="month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="w-40"
              />
            </div>
            <Button onClick={handleOpenCreate}>
              <Plus className="mr-2 h-4 w-4" /> Lançar Ponto/Falta
            </Button>
          </div>
        </div>

        <AttendanceTable records={records || []} />
      </section>

      <AttendanceForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending}
      />
    </div>
  )
}
