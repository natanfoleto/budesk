"use client"

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
import { Vehicle, VehicleTypeLabels } from "@/types/vehicle"

interface VehiclesTableProps {
  vehicles: Vehicle[]
  onDelete: (id: string) => void
}

export function VehiclesTable({ vehicles, onDelete }: VehiclesTableProps) {
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
                  <Link href={`/fleet/${vehicle.id}`} className="hover:underline text-primary">
                    {vehicle.plate}
                  </Link>
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
                  <div className="flex justify-end gap-2">
                    <Link href={`/fleet/${vehicle.id}`}>
                      <Button variant="outline" size="icon">
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onDelete(vehicle.id)}
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
