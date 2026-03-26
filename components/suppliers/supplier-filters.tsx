"use client"

import { FilterX, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SupplierFiltersProps {
  filters: {
    name: string
    document: string
    city: string
    status: string
  }
  onFilterChange: (key: string, value: string) => void
  onClearFilters: () => void
}

export function SupplierFilters({ filters, onFilterChange, onClearFilters }: SupplierFiltersProps) {
  const handleDocumentMask = (value: string) => {
    const raw = value.replace(/\D/g, "")
    if (raw.length <= 11) {
      return raw
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    }
    return raw
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .slice(0, 18)
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2 lg:col-span-2">
            <Label>Nome / Nome Fantasia</Label>
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
              <Input
                placeholder="Buscar por nome ou nome fantasia"
                className="pl-8"
                value={filters.name}
                onChange={(e) => onFilterChange("name", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>CPF / CNPJ</Label>
            <Input
              placeholder="00.000.000/0000-00"
              value={filters.document}
              onChange={(e) => onFilterChange("document", handleDocumentMask(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label>Cidade</Label>
            <Input
              placeholder="Buscar por cidade"
              value={filters.city}
              onChange={(e) => onFilterChange("city", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={filters.status}
              onValueChange={(v) => onFilterChange("status", v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Ativo</SelectItem>
                <SelectItem value="false">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            onClick={onClearFilters}
            className="text-muted-foreground w-full lg:col-start-5"
          >
            <FilterX className="h-4 w-4 mr-2" /> Limpar Filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
