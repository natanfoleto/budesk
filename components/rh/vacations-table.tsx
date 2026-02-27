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
import { Vacation } from "@/types/rh"

interface VacationsTableProps {
  vacations: Vacation[]
  onEdit: (vacation: Vacation) => void
  onDelete: (id: string) => void
  onConfirmPayment: (vacation: Vacation) => void
}

export function VacationsTable({ vacations, onEdit, onDelete, onConfirmPayment }: VacationsTableProps) {
  
  const getStatusBadge = (status: string) => {
    switch (status) {
    case "PAGA":
      return <Badge variant="default" className="bg-green-600">Paga</Badge>
    case "APROVADA":
      return <Badge variant="secondary" className="bg-blue-600">Aprovada</Badge>
    case "GOZADA":
      return <Badge variant="secondary" className="bg-purple-600">Gozada</Badge>
    default:
      return <Badge variant="outline" className="text-orange-600 border-orange-600">Prevista</Badge>
    }
  }

  if (vacations.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <p className="mt-2 text-sm text-muted-foreground">
            Nenhum período de férias registrado.
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
            <TableHead>Período Aquisitivo</TableHead>
            <TableHead>Gozo Início</TableHead>
            <TableHead>Gozo Fim</TableHead>
            <TableHead>Líquido C/ 1/3</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vacations.map((v) => {
            const sumLiquido = Number(v.valorFerias || 0) + Number(v.adicionalUmTerco || 0)

            return (
              <TableRow key={v.id}>
                <TableCell className="font-medium">{v.employee?.name || "N/A"}</TableCell>
                <TableCell>
                  {format(new Date(v.periodoAquisitivoInicio), "yyyy", { locale: ptBR })} - {format(new Date(v.periodoAquisitivoFim), "yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell>
                  {v.dataInicio ? format(new Date(v.dataInicio), "dd/MM/yyyy", { locale: ptBR }) : "--"}
                </TableCell>
                <TableCell>
                  {v.dataFim ? format(new Date(v.dataFim), "dd/MM/yyyy", { locale: ptBR }) : "--"}
                </TableCell>
                <TableCell className="font-semibold text-green-600">
                  {formatCurrency(sumLiquido)}
                </TableCell>
                <TableCell>{getStatusBadge(v.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {v.status !== "PAGA" && (
                      <Button
                        variant="outline"
                        size="icon"
                        title="Marcar como Pago (Gera Movimentação)"
                        onClick={() => onConfirmPayment(v)}
                      >
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onEdit(v)}
                      title="Editar"
                    >
                      <FileEdit className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onDelete(v.id)}
                      className="text-destructive hover:text-destructive"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
