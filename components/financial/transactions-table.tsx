"use client"

import { ExpenseCategory, PaymentMethod } from "@prisma/client"
import { Edit, FileText, Paperclip, Trash2 } from "lucide-react"

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
import { EXPENSE_CATEGORY_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/constants"
import { formatCentsToReal, formatDate } from "@/lib/utils"
import { Transaction } from "@/types/financial"

interface TransactionsTableProps {
  transactions: Transaction[]
  onEdit: (transaction: Transaction) => void
  onDelete: (id: string) => void
}

export function TransactionsTable({ transactions, onEdit, onDelete }: TransactionsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Fornecedor</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Doc</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center h-24">
                Nenhuma transação encontrada.
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction: Transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>{formatDate(transaction.date)}</TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {transaction.category && (transaction.category in EXPENSE_CATEGORY_LABELS)
                      ? EXPENSE_CATEGORY_LABELS[transaction.category as ExpenseCategory]
                      : transaction.category || "-"}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[150px] truncate">
                  {transaction.supplier?.name || "-"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={transaction.type === "ENTRADA" ? "default" : "destructive"}
                  >
                    {transaction.type === "ENTRADA" ? "ENTRADA" : "SAÍDA"}
                  </Badge>
                </TableCell>

                <TableCell className={transaction.type === "ENTRADA" ? "text-green-600" : "text-red-400"}>
                  {formatCentsToReal(transaction.valueInCents)}
                </TableCell>

                <TableCell>
                  {(transaction.paymentMethod in PAYMENT_METHOD_LABELS)
                    ? PAYMENT_METHOD_LABELS[transaction.paymentMethod as PaymentMethod]
                    : transaction.paymentMethod}
                </TableCell>

                <TableCell>
                  {transaction.attachmentUrl ? (
                    <a
                      href={transaction.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 transition-colors"
                      title="Ver Comprovante"
                    >
                      <Paperclip className="h-4 w-4" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground/30">
                      <FileText className="h-4 w-4" />
                    </span>
                  )}
                </TableCell>
                
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="icon" onClick={() => onEdit(transaction)}>
                      <Edit className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => onDelete(transaction.id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
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
