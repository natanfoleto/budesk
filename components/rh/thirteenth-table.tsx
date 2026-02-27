import { CheckCircle, Trash2 } from "lucide-react"

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
import { ThirteenthSalary } from "@/types/rh"

interface ThirteenthTableProps {
  records: ThirteenthSalary[]
  onDelete: (id: string) => void
  onToggleParcela: (record: ThirteenthSalary, isPrimeira: boolean) => void
}

export function ThirteenthTable({ records, onDelete, onToggleParcela }: ThirteenthTableProps) {
  
  const getStatusBadge = (status: string) => {
    switch (status) {
    case "PAGO":
      return <Badge variant="default" className="bg-green-600">Totalmente Pago</Badge>
    case "PARCIAL":
      return <Badge variant="secondary" className="bg-blue-600">Parcial</Badge>
    default:
      return <Badge variant="outline" className="text-orange-600 border-orange-600">Pendente</Badge>
    }
  }

  if (records.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <p className="mt-2 text-sm text-muted-foreground">
            Nenhum registro de 13º Salário encontrado.
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
            <TableHead>Ano Referência</TableHead>
            <TableHead>Meses Trabalhados</TableHead>
            <TableHead>Valor Total Bruto</TableHead>
            <TableHead>1ª Parcela (50%)</TableHead>
            <TableHead>2ª Parcela</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((r) => {
            const vTotal = Number(r.valorTotal)
            const v1 = Number(r.primeiraParcela) || vTotal / 2
            const v2 = Number(r.segundaParcela) || vTotal / 2

            return (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.employee?.name || "N/A"}</TableCell>
                <TableCell>{r.anoReferencia}</TableCell>
                <TableCell>{r.mesesTrabalhados}/12</TableCell>
                <TableCell className="font-semibold text-primary">
                  {formatCurrency(vTotal)}
                </TableCell>
                
                {/* 1ª Parcela */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className={r.primeiraPaga ? "text-green-600 font-medium" : "text-muted-foreground"}>
                      {formatCurrency(v1)}
                    </span>
                    {!r.primeiraPaga && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        title="Pagar 1ª Parcela"
                        onClick={() => onToggleParcela(r, true)}
                      >
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
                    {r.primeiraPaga && <CheckCircle className="h-4 w-4 text-green-600" />}
                  </div>
                </TableCell>

                {/* 2ª Parcela */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className={r.segundaPaga ? "text-green-600 font-medium" : "text-muted-foreground"}>
                      {formatCurrency(v2)}
                    </span>
                    {!r.segundaPaga && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        title="Pagar 2ª Parcela"
                        onClick={() => onToggleParcela(r, false)}
                      >
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
                    {r.segundaPaga && <CheckCircle className="h-4 w-4 text-green-600" />}
                  </div>
                </TableCell>

                <TableCell>{getStatusBadge(r.status)}</TableCell>
                
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onDelete(r.id)}
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
