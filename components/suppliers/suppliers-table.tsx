"use client"

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from "lucide-react"

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
import { SupplierWithDetails } from "@/types/supplier"

interface SuppliersTableProps {
  suppliers: SupplierWithDetails[]
  meta?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  onPageChange?: (page: number) => void
  onLimitChange?: (limit: number) => void
  onEdit: (supplier: SupplierWithDetails) => void
  onDelete: (supplier: SupplierWithDetails) => void
}

export function SuppliersTable({ 
  suppliers, 
  meta, 
  onPageChange, 
  onLimitChange, 
  onEdit,
  onDelete 
}: SuppliersTableProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border shadow-sm overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CPF/CNPJ</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                  Nenhum fornecedor encontrado.
                </TableCell>
              </TableRow>
            ) : (
              suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col max-w-[200px] sm:max-w-[250px] md:max-w-[300px] lg:max-w-[400px]">
                      <span className="truncate" title={supplier.name}>{supplier.name}</span>
                      {supplier.tradeName && (
                        <span className="text-xs text-muted-foreground truncate" title={supplier.tradeName}>{supplier.tradeName}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{supplier.document || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {supplier.personType === "LEGAL" ? "Jurídica" : "Física"}
                    </Badge>
                  </TableCell>
                  <TableCell>{supplier.city || "-"}</TableCell>
                  <TableCell>{supplier.phone || supplier.mobile || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={supplier.active ? "default" : "secondary"}>
                      {supplier.active ? "Ativo" : "Inativo"}
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
                        <DropdownMenuItem 
                          className="cursor-pointer"
                          onClick={() => onEdit(supplier)}
                        >
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive cursor-pointer"
                          onClick={() => onDelete(supplier)}
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
