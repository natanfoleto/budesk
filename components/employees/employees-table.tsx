"use client"

import { Employee } from "@prisma/client"
import { Edit, Trash2 } from "lucide-react"
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
import { formatCentsToReal } from "@/lib/utils"

interface EmployeesTableProps {
  employees: Employee[]
  onDelete: (id: string) => void
}

export function EmployeesTable({ employees, onDelete }: EmployeesTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Cargo/Função</TableHead>
            <TableHead>CPF</TableHead>
            <TableHead>Salário</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center h-24">
                Nenhum funcionário encontrado.
              </TableCell>
            </TableRow>
          ) : (
            employees.map((employee: Employee) => (
              <TableRow key={employee.id}>
                <TableCell className="font-medium">
                  <Link href={`/employees/${employee.id}`} className="hover:underline">
                    {employee.name}
                  </Link>
                </TableCell>
                <TableCell>{employee.role}</TableCell>
                <TableCell>{employee.document}</TableCell>
                <TableCell>{formatCentsToReal(employee.salaryInCents)}</TableCell>
                <TableCell>
                  <Badge variant={employee.active ? "default" : "secondary"}>
                    {employee.active ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/employees/${employee.id}`}>
                      <Button variant="outline" size="icon">
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => onDelete(employee.id)}
                    >
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
