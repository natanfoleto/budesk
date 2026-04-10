"use client"

import { ExpenseCategory, PaymentMethod } from "@prisma/client"
import { FileText, MoreHorizontal, Paperclip } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
            <TableHead>Pagamento</TableHead>
            <TableHead>Doc</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center h-24">
                Nenhuma transação encontrada.
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction: Transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>{formatDate(transaction.date)}</TableCell>
                <TableCell className="max-w-[200px] truncate" title={transaction.description || ""}>
                  {transaction.description}
                </TableCell>
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Ações</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        className="cursor-pointer" 
                        onClick={() => onEdit(transaction)}
                      >
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="cursor-pointer text-destructive focus:text-destructive" 
                        onClick={() => onDelete(transaction.id)}
                      >
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
