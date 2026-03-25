import { ChevronDown, ChevronUp, Edit, Trash2 } from "lucide-react"
import React, { useState } from "react"

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
import { useUpdateAccountInstallment } from "@/hooks/use-financial"
import { formatCentsToReal, formatDate } from "@/lib/utils"
import { AccountPayable } from "@/types/financial"

interface AccountsPayableTableProps {
  accounts: AccountPayable[]
  onEdit: (account: AccountPayable) => void
  onDelete: (id: string) => void
}

export function AccountsPayableTable({ accounts, onEdit, onDelete }: AccountsPayableTableProps) {
  const [expandedRows, setExpandedRows] = useState<string[]>([])
  const updateInstallment = useUpdateAccountInstallment()

  const toggleRow = (id: string) => {
    setExpandedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    )
  }

  const getStatusColor = (status: string): "success" | "destructive" | "warning" | "secondary" | "default" | "outline" => {
    if (status === "PAGA") return "success"
    if (status === "ATRASADA") return "destructive"
    if (status === "PENDENTE") return "warning"
    return "secondary"
  }

  const getStatusLabel = (status: string) => {
    if (status === "PAGA") return "Paga"
    if (status === "ATRASADA") return "Atrasada"
    return "Pendente"
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border shadow-sm overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-0"></TableHead>
              <TableHead>Próximo Vencimento</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead>Parcelas</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center h-24">
                Nenhuma conta encontrada.
                </TableCell>
              </TableRow>
            ) : (
              accounts.map((account) => (
                <React.Fragment key={account.id}>
                  <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => toggleRow(account.id)}>
                    <TableCell>
                      {expandedRows.includes(account.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </TableCell>
                    <TableCell>
                      {formatDate(account.nextDueDate || account.installments?.[account.installments.length - 1]?.dueDate || account.createdAt || new Date())}
                    </TableCell>
                    <TableCell>{account.description}</TableCell>
                    <TableCell className="capitalize">
                      {account.paymentMethod.toLowerCase()}
                    </TableCell>
                    <TableCell>{formatCentsToReal(account.totalValueInCents)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">
                          {account.paidInstallmentsCount}/{account.installmentsCount} pagas
                        </span>
                        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary" 
                            style={{ width: `${(account.paidInstallmentsCount || 0) / (account.installmentsCount || 1) * 100}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(account.status || "")}>
                        {getStatusLabel(account.status || "")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => onEdit(account)}>
                          <Edit className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => onDelete(account.id)}>
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedRows.includes(account.id) && (
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={8} className="p-0">
                        <div className="p-4">
                          <div className="rounded-md border bg-background">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Nº</TableHead>
                                  <TableHead>Vencimento</TableHead>
                                  <TableHead>Valor</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead></TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {account.installments?.map((inst) => (
                                  <TableRow key={inst.id}>
                                    <TableCell>{inst.installmentNumber}/{account.installmentsCount}</TableCell>
                                    <TableCell>{formatDate(inst.dueDate)}</TableCell>
                                    <TableCell>{formatCentsToReal(inst.valueInCents)}</TableCell>
                                    <TableCell>
                                      <Badge variant={getStatusColor(inst.status)}>
                                        {getStatusLabel(inst.status)}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {inst.status === "PAGA" ? (
                                        <Button 
                                          variant="link" 
                                          size="sm"
                                          className="text-xs"
                                          disabled={updateInstallment.isPending}
                                          onClick={() => updateInstallment.mutate({ id: inst.id, status: "PENDENTE" })}
                                        >
                                          Estornar
                                        </Button>
                                      ) : (
                                        <Button 
                                          variant="link" 
                                          size="sm"
                                          className="text-xs"
                                          disabled={updateInstallment.isPending}
                                          onClick={() => updateInstallment.mutate({ id: inst.id, status: "PAGA" })}
                                        >
                                          Pagar
                                        </Button>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
