import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AttendanceRecord } from "@/types/rh"

interface AttendanceTableProps {
  records: AttendanceRecord[]
}

export function AttendanceTable({ records }: AttendanceTableProps) {
  
  const getBadgeForType = (tipo: string) => {
    switch (tipo) {
    case "PRESENCA":
      return <Badge variant="default" className="bg-green-600">Presença</Badge>
    case "FALTA":
      return <Badge variant="destructive">Falta</Badge>
    case "FALTA_JUSTIFICADA":
      return <Badge variant="secondary" className="bg-orange-500">Justificada</Badge>
    case "ATESTADO":
      return <Badge variant="secondary" className="bg-blue-500">Atestado</Badge>
    default:
      return <Badge variant="outline">{tipo}</Badge>
    }
  }

  if (records.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <p className="mt-2 text-sm text-muted-foreground">
            Nenhum registro de frequência encontrado para a pesquisa fornecida.
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
            <TableHead>Data</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Horas Normais</TableHead>
            <TableHead>Horas Extras</TableHead>
            <TableHead>Observação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.employee?.name || "N/A"}</TableCell>
              <TableCell>
                {format(new Date(r.data), "dd/MM/yyyy", { locale: ptBR })}
              </TableCell>
              <TableCell>{getBadgeForType(r.tipo)}</TableCell>
              <TableCell>{r.horasTrabalhadas ? `${r.horasTrabalhadas}h` : "--"}</TableCell>
              <TableCell>{r.horasExtras ? `${r.horasExtras}h` : "--"}</TableCell>
              <TableCell className="max-w-[200px] truncate" title={r.observacao || ""}>
                {r.observacao || "--"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
