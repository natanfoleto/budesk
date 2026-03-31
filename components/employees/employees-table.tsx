"use client"

import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  MoreHorizontal,
  Tag
} from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { formatCentsToReal } from "@/lib/utils"
import { EmployeeWithDetails } from "@/types/employee"

interface EmployeesTableProps {
  employees: EmployeeWithDetails[]
  meta?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  onPageChange?: (page: number) => void
  onLimitChange?: (limit: number) => void
  onDelete: (id: string) => void
  onEditTag?: (id: string) => void
}

export function EmployeesTable({ employees, meta, onPageChange, onLimitChange, onDelete, onEditTag }: EmployeesTableProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border shadow-sm overflow-hidden bg-card">
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
              employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Link href={`/employees/${employee.id}`} className="hover:underline">
                        {employee.name}
                      </Link>

                      <div className="flex items-center gap-1.5 pt-0.5">
                        {employee.tags?.map((tag) => (
                          <span 
                            key={tag.id} 
                            title={tag.name} 
                            className="flex items-center cursor-pointer transition-transform hover:scale-110"
                            onClick={() => onEditTag?.(tag.id)}
                          >
                            <Tag 
                              className="size-3.5" 
                              style={{ color: tag.color }}
                              fill={tag.color}
                              fillOpacity={0.15}
                            />
                          </span>
                        ))}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{employee.job?.name || employee.role}</TableCell>
                  <TableCell>{employee.document}</TableCell>
                  <TableCell>{formatCentsToReal(employee.salaryInCents)}</TableCell>
                  <TableCell>
                    <Badge variant={employee.active ? "default" : "secondary"}>
                      {employee.active ? "Ativo" : "Encerrado"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/employees/${employee.id}`} className="cursor-pointer">
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive cursor-pointer"
                          onClick={() => onDelete(employee.id)}
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

      {meta && (
        <div className="flex items-center justify-between px-2 pt-2">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">Linhas por página</p>
              <Select
                value={String(meta.limit)}
                onValueChange={(v) => onLimitChange?.(Number(v))}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={meta.limit} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={String(pageSize)}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              Total de registros: {meta.total}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-sm text-muted-foreground pr-2">
              Página {meta.page} de {meta.totalPages}
            </div>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => onPageChange?.(1)}
              disabled={meta.page <= 1}
            >
              <span className="sr-only">Primeira página</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange?.(meta.page - 1)}
              disabled={meta.page <= 1}
            >
              <span className="sr-only">Página anterior</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange?.(meta.page + 1)}
              disabled={meta.page >= meta.totalPages}
            >
              <span className="sr-only">Próxima página</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => onPageChange?.(meta.totalPages)}
              disabled={meta.page >= meta.totalPages}
            >
              <span className="sr-only">Última página</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
