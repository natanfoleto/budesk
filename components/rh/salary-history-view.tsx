import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import { SalaryHistory } from "@/types/rh"

interface SalaryHistoryViewProps {
  history: SalaryHistory[]
}

export function SalaryHistoryView({ history }: SalaryHistoryViewProps) {
  
  if (history.length === 0) {
    return (
      <div className="flex min-h-[150px] flex-col items-center justify-center rounded-md border border-dashed p-4 text-center animate-in fade-in-50">
        <p className="text-sm text-muted-foreground">
          Nenhum histórico salarial encontrado.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data da Alteração</TableHead>
            <TableHead>Sálário Anterior</TableHead>
            <TableHead>Novo Salário</TableHead>
            <TableHead>Motivo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((h) => {
            const oldValue = Number(h.salarioAnterior)
            const newValue = Number(h.novoSalario)
            const diff = newValue - oldValue
            const isIncrease = diff > 0

            return (
              <TableRow key={h.id}>
                <TableCell>
                  {format(new Date(h.dataVigencia), "dd/MM/yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell className="text-muted-foreground line-through">
                  {formatCurrency(oldValue)}
                </TableCell>
                <TableCell className={`font-semibold ${isIncrease ? 'text-green-600' : 'text-primary'}`}>
                  {formatCurrency(newValue)}
                  {isIncrease && <span className="text-xs ml-2 text-green-600/70">(+{formatCurrency(diff)})</span>}
                </TableCell>
                <TableCell className="max-w-[200px] truncate" title={h.motivo || ""}>
                  {h.motivo || "--"}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
