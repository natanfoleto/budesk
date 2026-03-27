import { ExpenseCategory, PaymentMethod } from "@prisma/client"
import { ChevronDown, ChevronUp, Edit, FileText, Paperclip, Trash2 } from "lucide-react"
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useUpdateAccountInstallment } from "@/hooks/use-financial"
import { EXPENSE_CATEGORY_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/constants"
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
              <TableHead>Vencimento</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Parcelas</TableHead>
              <TableHead>Doc</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center h-24">
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
                    <TableCell>
                      {(account.paymentMethod in PAYMENT_METHOD_LABELS)
                        ? PAYMENT_METHOD_LABELS[account.paymentMethod as PaymentMethod]
                        : account.paymentMethod}
                    </TableCell>
                    <TableCell>{formatCentsToReal(account.totalValueInCents)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {account.category && (account.category in EXPENSE_CATEGORY_LABELS)
                          ? EXPENSE_CATEGORY_LABELS[account.category as ExpenseCategory]
                          : account.category || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {account.supplier?.name || "-"}
                    </TableCell>
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
                      <div className="flex items-center gap-2">
                        {account.attachmentUrl ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <a 
                                  href={account.attachmentUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:text-primary/80 transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Paperclip className="h-4 w-4" />
                                </a>
                              </TooltipTrigger>
                              <TooltipContent>Comprovante</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span className="text-muted-foreground/30">
                            <FileText className="h-4 w-4" />
                          </span>
                        )}

                        {account.invoiceUrl && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <a 
                                  href={account.invoiceUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-emerald-600 hover:text-emerald-700 transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <FileText className="h-4 w-4" />
                                </a>
                              </TooltipTrigger>
                              <TooltipContent>Boleto / Nota</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
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
                      <TableCell colSpan={11} className="p-0">
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
