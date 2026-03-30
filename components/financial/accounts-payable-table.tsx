import { AttachmentType, ExpenseCategory, PaymentMethod } from "@prisma/client"
import { ChevronDown, ChevronUp, MoreHorizontal, Plus } from "lucide-react"
import React, { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FileUploader } from "@/components/ui/file-uploader"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  useAddInstallmentAttachment, 
  useDeleteInstallmentAttachment, 
  useUpdateAccountInstallment 
} from "@/hooks/use-financial"
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
  const [uploadingForInstallment, setUploadingForInstallment] = useState<string | null>(null)
  const [newAttachmentType, setNewAttachmentType] = useState<AttachmentType>("BOLETO")
  
  const updateInstallment = useUpdateAccountInstallment()
  const addAttachment = useAddInstallmentAttachment()
  const deleteAttachment = useDeleteInstallmentAttachment()

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
                      <Badge variant={getStatusColor(account.status || "")}>
                        {getStatusLabel(account.status || "")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Ações</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="cursor-pointer" onClick={() => onEdit(account)}>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={() => onDelete(account.id)}>
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  {expandedRows.includes(account.id) && (
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={10} className="p-0">
                        <div className="p-4">
                          <div className="rounded-md border bg-background">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Nº</TableHead>
                                  <TableHead>Vencimento</TableHead>
                                  <TableHead>Valor</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Anexos</TableHead>
                                  <TableHead className="text-right">Ações</TableHead>
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
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        {inst.attachments?.map((att) => (
                                          <Dialog key={att.id}>
                                            <DialogTrigger asChild>
                                              <Badge 
                                                variant="outline" 
                                                className="cursor-pointer hover:bg-accent uppercase text-[10px] h-6"
                                              >
                                                {att.type === "BOLETO" ? "Boleto" : att.type === "COMPROVANTE" ? "Comprovante" : att.type}
                                              </Badge>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[300px]">
                                              <DialogHeader>
                                                <DialogTitle>Anexo: {att.type}</DialogTitle>
                                              </DialogHeader>
                                              <div className="flex flex-col gap-2 mt-4">
                                                <Button variant="outline" asChild className="w-full">
                                                  <a href={att.fileUrl} target="_blank" rel="noopener noreferrer">
                                                    Visualizar
                                                  </a>
                                                </Button>
                                                <Button 
                                                  variant="destructive" 
                                                  className="w-full"
                                                  onClick={() => {
                                                    if (confirm("Remover este anexo?")) {
                                                      deleteAttachment.mutate({ installmentId: inst.id, attachmentId: att.id })
                                                    }
                                                  }}
                                                >
                                                  Excluir
                                                </Button>
                                              </div>
                                            </DialogContent>
                                          </Dialog>
                                        ))}

                                        <Dialog 
                                          open={uploadingForInstallment === inst.id} 
                                          onOpenChange={(open) => !open && setUploadingForInstallment(null)}
                                        >
                                          <DialogTrigger asChild>
                                            <Button 
                                              variant="outline" 
                                              size="icon" 
                                              className="h-7 w-7 rounded-full border-dashed"
                                              onClick={() => setUploadingForInstallment(inst.id)}
                                            >
                                              <Plus className="h-3.5 w-3.5" />
                                            </Button>
                                          </DialogTrigger>
                                          <DialogContent className="sm:max-w-md">
                                            <DialogHeader>
                                              <DialogTitle>Adicionar Anexo - Parcela {inst.installmentNumber}</DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                              <div className="space-y-2">
                                                <label className="text-sm font-medium">Tipo de Documento</label>
                                                <Select 
                                                  value={newAttachmentType} 
                                                  onValueChange={(val) => setNewAttachmentType(val as AttachmentType)}
                                                >
                                                  <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Selecione o tipo" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="BOLETO">Boleto / Nota</SelectItem>
                                                    <SelectItem value="COMPROVANTE">Comprovante de Pagamento</SelectItem>
                                                    <SelectItem value="NOTA_FISCAL">Nota Fiscal</SelectItem>
                                                    <SelectItem value="CONTRATO">Contrato</SelectItem>
                                                    <SelectItem value="OUTROS">Outros</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </div>
                                              <FileUploader
                                                label="Upload de Arquivo"
                                                value={""}
                                                onChange={(url) => {
                                                  if (url) {
                                                    addAttachment.mutate({
                                                      installmentId: inst.id,
                                                      data: {
                                                        type: newAttachmentType,
                                                        fileUrl: url,
                                                        fileName: url.split("/").pop() || "arquivo"
                                                      }
                                                    })
                                                    setUploadingForInstallment(null)
                                                  }
                                                }}
                                                folder="financial"
                                              />
                                            </div>
                                          </DialogContent>
                                        </Dialog>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex justify-end gap-2 text-right">
                                        {inst.status === "PAGA" ? (
                                          <Button 
                                            variant="link" 
                                            size="sm"
                                            className="text-xs px-0"
                                            disabled={updateInstallment.isPending}
                                            onClick={() => updateInstallment.mutate({ id: inst.id, status: "PENDENTE" })}
                                          >
                                            Estornar
                                          </Button>
                                        ) : (
                                          <Button 
                                            variant="link" 
                                            size="sm"
                                            className="text-xs px-0"
                                            disabled={updateInstallment.isPending}
                                            onClick={() => updateInstallment.mutate({ id: inst.id, status: "PAGA" })}
                                          >
                                            Pagar
                                          </Button>
                                        )}
                                      </div>
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
