"use client"

import { TimeRecord } from "@prisma/client"
import { Edit, Plus } from "lucide-react"
import { useState } from "react"

import { SecureActionDialog } from "@/components/employees/secure-action-dialog"
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
import { 
  useCreateTimeRecord, 
  useDeleteTimeRecord, 
  useTimeRecords, 
  useUpdateTimeRecord 
} from "@/hooks/use-employees"
import { formatDate } from "@/lib/utils"
import { TimeRecordFormData } from "@/types/employee"

interface TimeTrackingViewProps {
  employeeId: string
}

export function TimeTrackingView({ employeeId }: TimeTrackingViewProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<TimeRecord | null>(null)
  
  const { data: records } = useTimeRecords(employeeId)
  const createMutation = useCreateTimeRecord()
  const updateMutation = useUpdateTimeRecord()
  const deleteMutation = useDeleteTimeRecord()

  // Secure Dialog State
  const [secureDialog, setSecureDialog] = useState<{
    isOpen: boolean
    title: string
    description: string
    action: () => Promise<void>
    type: "delete" | "update"
      }>({
        isOpen: false,
        title: "",
        description: "",
        action: async () => {},
        type: "delete",
      })

  const openSecureAction = (
    title: string, 
    description: string, 
    type: "delete" | "update", 
    action: () => Promise<any>
  ) => {
    setSecureDialog({
      isOpen: true,
      title,
      description,
      type,
      action: async () => {
        await action()
      }
    })
  }

  const handleOpenForm = (record?: TimeRecord) => {
    if (record) {
      setSelectedRecord(record)
    } else {
      setSelectedRecord(null)
    }
    setIsFormOpen(true)
  }

  const handleSubmit = (data: TimeRecordFormData) => {
    if (selectedRecord) {
      openSecureAction("Atualizar Ponto", "Deseja confirmar a alteração deste registro de ponto?", "update", async () => {
        await updateMutation.mutateAsync({ employeeId, recordId: selectedRecord.id, data })
        setIsFormOpen(false)
        setSelectedRecord(null)
      })
    } else {
      createMutation.mutate({ employeeId, data }, {
        onSuccess: () => setIsFormOpen(false)
      })
    }
  }

  const handleDelete = () => {
    if (selectedRecord) {
      openSecureAction("Excluir Ponto", "Esta ação não pode ser desfeita.", "delete", async () => {
        await deleteMutation.mutateAsync({ employeeId, recordId: selectedRecord.id })
        setIsFormOpen(false)
        setSelectedRecord(null)
      })
    }
  }

  // Format Time only
  const formatTime = (date: string | Date | undefined | null) => {
    if (!date) return "-"
    return new Date(date).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => handleOpenForm()} className="cursor-pointer">
          <Plus className="h-4 w-4" /> Registrar Ponto
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
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!records || records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
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
                  <TableCell className="max-w-[150px] truncate" title={record.absent ? "Falta" : record.justification || "Normal"}>
                    {record.absent ? <span className="text-red-500 font-medium">Falta</span> : (record.justification || "Normal")}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => handleOpenForm(record)} className="cursor-pointer h-8 w-8 p-0">
                      <Edit className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TimeRecordForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        initialData={selectedRecord ? {
          date: new Date(selectedRecord.date).toISOString().split("T")[0],
          entryTime: new Date(selectedRecord.entryTime).toLocaleTimeString("pt-BR", {hour: '2-digit', minute:'2-digit'}),
          exitTime: selectedRecord.exitTime ? new Date(selectedRecord.exitTime).toLocaleTimeString("pt-BR", {hour: '2-digit', minute:'2-digit'}) : undefined,
          absent: selectedRecord.absent,
          justification: selectedRecord.justification || "",
          manualWorkedHours: selectedRecord.workedHours ? Number(selectedRecord.workedHours) : undefined,
          manualOvertime: selectedRecord.overtimeHours ? Number(selectedRecord.overtimeHours) : undefined,
        } : undefined}
        isLoading={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
      />

      <SecureActionDialog 
        open={secureDialog.isOpen} 
        onOpenChange={(open) => setSecureDialog({ ...secureDialog, isOpen: open })}
        onConfirm={secureDialog.action}
        title={secureDialog.title}
        description={secureDialog.description}
        actionType={secureDialog.type}
      />
    </div>
  )
}
