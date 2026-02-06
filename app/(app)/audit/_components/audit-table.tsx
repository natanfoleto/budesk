"use client"

import { format } from "date-fns"
import { Eye } from "lucide-react"
import Link from "next/link"

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

// Define locally or import if a shared type exists. 
// Using same type definition as was in page.tsx
type AuditLog = {
  id: string
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN"
  entity: string
  entityId: string | null
  createdAt: string
  user: {
    name: string | null
    email: string
  } | null
}

interface AuditTableProps {
  logs: AuditLog[]
}

export function AuditTable({ logs }: AuditTableProps) {
  const getActionVariant = (action: string) => {
    const variants: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      CREATE: "default",
      UPDATE: "secondary",
      DELETE: "destructive",
      LOGIN: "outline",
    }
    return variants[action] || "secondary"
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ação</TableHead>
            <TableHead>Entidade</TableHead>
            <TableHead>Usuário</TableHead>
            <TableHead>Data/Hora</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center h-24">
                Nenhum registro encontrado.
              </TableCell>
            </TableRow>
          ) : (
            logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  <Badge variant={getActionVariant(log.action)}>{log.action}</Badge>
                </TableCell>
                <TableCell>{log.entity}</TableCell>
                <TableCell>
                  {log.user ? (
                    <div className="flex flex-col">
                      <span className="font-medium">{log.user.name || "Sem nome"}</span>
                      <span className="text-xs text-muted-foreground">{log.user.email}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Sistema/Desconhecido</span>
                  )}
                </TableCell>
                <TableCell>
                  {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end">
                    <Link href={`/audit/${log.id}`}>
                      <Button variant="ghost" size="icon" title="Ver Detalhes">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </Link>
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
