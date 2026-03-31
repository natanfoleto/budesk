"use client"

import { MoreHorizontal } from "lucide-react"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Vehicle, VehicleTypeLabels } from "@/types/vehicle"

interface VehiclesTableProps {
  vehicles: Vehicle[]
  onEdit?: (vehicle: Vehicle) => void
  onDelete: (id: string) => void
}

export function VehiclesTable({ vehicles, onEdit, onDelete }: VehiclesTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Placa</TableHead>
            <TableHead>Modelo</TableHead>
            <TableHead>Marca</TableHead>
            <TableHead>Ano</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                Nenhum veículo encontrado.
              </TableCell>
            </TableRow>
          ) : (
            vehicles.map((vehicle) => (
              <TableRow key={vehicle.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {vehicle.color && (
                      <div 
                        className="w-3 h-3 rounded-full border border-muted" 
                        style={{ backgroundColor: vehicle.color }}
                        title={vehicle.color}
                      />
                    )}
                    <Link href={`/fleet/${vehicle.id}`} className="hover:underline text-primary">
                      {vehicle.plate}
                    </Link>
                  </div>
                </TableCell>
                <TableCell>{vehicle.model}</TableCell>
                <TableCell>{vehicle.brand}</TableCell>
                <TableCell>{vehicle.year}</TableCell>
                <TableCell>
                  {VehicleTypeLabels[vehicle.type]}
                </TableCell>
                <TableCell>
                  <Badge variant={vehicle.active ? "default" : "secondary"}>
                    {vehicle.active ? "Ativo" : "Inativo"}
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
                      {onEdit ? (
                        <DropdownMenuItem onClick={() => onEdit(vehicle)} className="cursor-pointer">
                          Editar
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem asChild>
                          <Link href={`/fleet/${vehicle.id}`} className="cursor-pointer">
                            Editar
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive cursor-pointer"
                        onClick={() => onDelete(vehicle.id)}
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
