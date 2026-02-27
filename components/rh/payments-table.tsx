import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CheckCircle, FileEdit, Trash2 } from "lucide-react"

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
import { formatCurrency } from "@/lib/utils"
import { RHPayment } from "@/types/rh"

interface PaymentsTableProps {
  payments: RHPayment[]
  onEdit: (payment: RHPayment) => void
  onDelete: (id: string) => void
  onConfirm: (payment: RHPayment) => void
}

export function PaymentsTable({ payments, onEdit, onDelete, onConfirm }: PaymentsTableProps) {
  
  const getStatusBadge = (status: string) => {
    switch (status) {
    case "PAGO":
      return <Badge variant="default" className="bg-green-600">Pago</Badge>
    case "SIMULADO":
      return <Badge variant="secondary">Simulado</Badge>
    case "CANCELADO":
      return <Badge variant="destructive">Cancelado</Badge>
    default:
      return <Badge variant="outline" className="text-orange-600 border-orange-600">Pendente</Badge>
    }
  }

  const getTypeStr = (tipo: string) => {
    const tipos: Record<string, string> = {
      SALARIO: "Salário",
      DIARIA: "Diária",
      COMISSAO: "Comissão",
      BONUS: "Bônus",
      RESCISAO: "Rescisão",
      FERIAS: "Férias",
      DECIMO_TERCEIRO: "13º Salário",
    }
    return tipos[tipo] || tipo
  }

  if (payments.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <p className="mt-2 text-sm text-muted-foreground">
            Nenhum pagamento registrado.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Funcionário</TableHead>
            <TableHead>Competência</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Líquido</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Dt Pagamento</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.employee?.name || "N/A"}</TableCell>
              <TableCell>{p.competencia}</TableCell>
              <TableCell>{getTypeStr(p.tipoPagamento)}</TableCell>
              <TableCell className="font-semibold text-green-600">
                {formatCurrency(Number(p.totalLiquido))}
              </TableCell>
              <TableCell>{getStatusBadge(p.status)}</TableCell>
              <TableCell>
                {p.dataPagamento ? format(new Date(p.dataPagamento), "dd/MM/yyyy", { locale: ptBR }) : "--"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {p.status !== "PAGO" && p.status !== "CANCELADO" && (
                    <Button
                      variant="outline"
                      size="icon"
                      title="Confirmar Pagamento (Gera Transação de Caixa)"
                      onClick={() => onConfirm(p)}
                    >
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onEdit(p)}
                    title="Editar"
                  >
                    <FileEdit className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onDelete(p.id)}
                    className="text-destructive hover:text-destructive"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
