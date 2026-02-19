"use client"

import { Edit, Filter, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCentsToReal } from "@/lib/utils"
import { Maintenance } from "@/types/vehicle"

import {
  MaintenancePriorityLabels,
  MaintenanceStatus,
  MaintenanceStatusLabels,
  MaintenanceTypeLabels,
} from "./maintenance-schema"

interface MaintenanceListProps {
  vehicleId: string
  maintenances: Maintenance[]
  fetchMaintenances: () => void
  onEdit: (maintenance: Maintenance) => void
  onDelete?: (maintenanceId: string) => Promise<void>
}

export function MaintenanceList({
  vehicleId,
  maintenances,
  fetchMaintenances,
  onEdit,
  onDelete,
}: MaintenanceListProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  const handleDelete = async (id: string) => {
    // Only use browser confirm if NO external delete handler is provided
    if (!onDelete && !confirm("Tem certeza que deseja excluir esta manutenção?")) return

    setIsDeleting(id)
    try {
      if (onDelete) {
        // Parent handles confirmation (e.g. SecureActionDialog)
        await onDelete(id)
        // Toast is handled by parent or query invalidated automatically
      } else {
        const response = await fetch(`/api/vehicles/${vehicleId}/maintenances/${id}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          throw new Error("Erro ao excluir manutenção")
        }

        toast.success("Manutenção excluída")
        fetchMaintenances()
      }
    } catch (error) {
      console.error(error)
      toast.error("Erro ao excluir")
    } finally {
      setIsDeleting(null)
    }
  }

  const getStatusBadge = (maintenance: Maintenance) => {
    const status = maintenance.status
    const scheduledDate = new Date(maintenance.scheduledDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Calculate difference in days
    const diffTime = scheduledDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (status === MaintenanceStatus.REALIZADA) {
      return <Badge className="bg-green-500 hover:bg-green-600">Realizada</Badge>
    }
    
    if (status === MaintenanceStatus.CANCELADA) {
      return <Badge variant="destructive">Cancelada</Badge>
    }

    // Logic for Pending/Scheduled
    if (diffDays < 0) {
      return <Badge className="bg-red-500 hover:bg-red-600">Atrasada ({Math.abs(diffDays)}d)</Badge>
    } else if (diffDays <= 7) {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Próxima ({diffDays}d)</Badge>
    } else {
      return <Badge variant="secondary">Em dia</Badge>
    }
  }

  const filteredMaintenances = maintenances.filter((m) => {
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(m.status)
    const matchesSearch = 
      m.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.category.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesSearch
  })

  // Sort by scheduledDate desc
  filteredMaintenances.sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())

  return (
    <div className="space-y-4">
      {maintenances.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Input 
              placeholder="Buscar por descrição ou categoria..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <Filter className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Filtros
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Filtrar por Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {Object.values(MaintenanceStatus).map((status) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={statusFilter.includes(status)}
                  onCheckedChange={(checked) => {
                    setStatusFilter(
                      checked
                        ? [...statusFilter, status]
                        : statusFilter.filter((value) => value !== status)
                    )
                  }}
                >
                  {MaintenanceStatusLabels[status]}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data Prog.</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Custo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMaintenances.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
                  Nenhuma manutenção encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredMaintenances.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    {new Date(m.scheduledDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{MaintenanceTypeLabels[m.type as keyof typeof MaintenanceTypeLabels]}</TableCell>
                  <TableCell>{m.category}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={m.description}>{m.description}</TableCell>
                  <TableCell>{getStatusBadge(m)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{MaintenanceStatusLabels[m.status as keyof typeof MaintenanceStatusLabels]}</Badge>
                  </TableCell>
                  <TableCell>{MaintenancePriorityLabels[m.priority as keyof typeof MaintenancePriorityLabels]}</TableCell>
                  <TableCell>
                    {m.finalCost 
                      ? <span className="font-medium text-green-600">{formatCentsToReal(m.finalCost)}</span>
                      : <span className="text-muted-foreground text-xs">{formatCentsToReal(m.estimatedCost)} (Est.)</span>
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onEdit(m)}
                      >
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(m.id)}
                        disabled={isDeleting === m.id}
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
    </div>
  )
}
