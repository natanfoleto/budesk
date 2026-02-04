"use client"

import { Plus } from "lucide-react"
import { useState } from "react"

import { TimeRecordForm } from "@/components/employees/time-record-form"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useCreateTimeRecord, useTimeRecords } from "@/hooks/use-employees"
import { TimeRecordFormData } from "@/types/employee"
import { TimeRecord } from "@prisma/client"
import { formatDate } from "@/lib/utils"

interface TimeTrackingViewProps {
  employeeId: string
}

export function TimeTrackingView({ employeeId }: TimeTrackingViewProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const { data: records } = useTimeRecords(employeeId)
  const createMutation = useCreateTimeRecord()

  const handleCreate = (data: TimeRecordFormData) => {
    createMutation.mutate({ employeeId, data }, {
      onSuccess: () => setIsFormOpen(false)
    })
  }

  // Format Time only
  const formatTime = (date: string | Date | undefined | null) => {
    if (!date) return "-"
    return new Date(date).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsFormOpen(true)} className="cursor-pointer">
          <Plus className="mr-2 h-4 w-4" /> Registrar Ponto
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Entrada</TableHead>
              <TableHead>Saída</TableHead>
              <TableHead>Horas Trab.</TableHead>
              <TableHead>Extras</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!records || records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            ) : (
              records.map((record: TimeRecord) => (
                <TableRow key={record.id}>
                  <TableCell>{formatDate(record.date)}</TableCell>
                  <TableCell>{formatTime(record.entryTime)}</TableCell>
                  <TableCell>{formatTime(record.exitTime)}</TableCell>
                  <TableCell>{record.workedHours ? `${Number(record.workedHours).toFixed(2)}h` : "-"}</TableCell>
                  <TableCell>{record.overtimeHours ? `${Number(record.overtimeHours).toFixed(2)}h` : "-"}</TableCell>
                  <TableCell>{record.absent ? "Falta" : "Normal"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TimeRecordForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleCreate}
        isLoading={createMutation.isPending}
      />
    </div>
  )
}
