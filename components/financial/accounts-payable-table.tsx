"use client"

import { Edit2, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency, formatDate } from "@/lib/utils"

interface AccountsPayableTableProps {
  accounts: any[]
  onEdit: (account: any) => void
  onDelete: (id: string) => void
}

export function AccountsPayableTable({ accounts, onEdit, onDelete }: AccountsPayableTableProps) {
  const getStatusColor = (status: string, date: string) => {
    if (status === "PAGA") return "default" // or success color if available
    const dueDate = new Date(date)
    const today = new Date()
    today.setHours(0,0,0,0)
    
    if (dueDate < today) return "destructive"
    if (dueDate.getTime() === today.getTime()) return "warning" // check if warning variant exists, else default/secondary
    return "secondary"
  }

  const getStatusLabel = (status: string, date: string) => {
    if (status === "PAGA") return "Paga"
    const dueDate = new Date(date)
    const today = new Date()
    today.setHours(0,0,0,0)

    if (dueDate < today) return "Atrasada"
    if (dueDate.getTime() === today.getTime()) return "Vence Hoje"
    return "Pendente"
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vencimento</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Fornecedor</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center h-24">
                Nenhuma conta encontrada.
              </TableCell>
            </TableRow>
          ) : (
            accounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell>{formatDate(account.dueDate)}</TableCell>
                <TableCell>{account.description}</TableCell>
                <TableCell>{account.supplier?.name || "-"}</TableCell>
                <TableCell>{formatCurrency(account.amount)}</TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(account.status, account.dueDate) as any}>
                    {getStatusLabel(account.status, account.dueDate)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(account)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(account.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
