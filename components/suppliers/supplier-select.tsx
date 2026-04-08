"use client"

import { Check, ChevronsUpDown } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useSuppliers } from "@/hooks/use-suppliers"
import { cn } from "@/lib/utils"

interface SupplierSelectProps {
  value?: string | null
  onChange: (value: string | null) => void
  disabled?: boolean
}

export function SupplierSelect({ value, onChange, disabled }: SupplierSelectProps) {
  const [open, setOpen] = React.useState(false)
  const { data: response } = useSuppliers({ active: "all" })
  const suppliers = response?.data || []

  const selectedSupplier = suppliers.find((s) => s.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled}
        >
          {selectedSupplier 
            ? (selectedSupplier.tradeName ? `${selectedSupplier.tradeName} (${selectedSupplier.name})` : selectedSupplier.name)
            : "Selecionar fornecedor"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0 w-(--radix-popover-trigger-width)">
        <Command>
          <CommandInput placeholder="Buscar fornecedor" />
          <CommandList>
            <CommandEmpty>Nenhum fornecedor encontrado.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="none"
                onSelect={() => {
                  onChange(null)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    !value ? "opacity-100" : "opacity-0"
                  )}
                />
                Nenhum
              </CommandItem>
              {suppliers.map((supplier) => (
                <CommandItem
                  key={supplier.id}
                  value={`${supplier.name} ${supplier.tradeName || ""}`}
                  onSelect={() => {
                    onChange(supplier.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === supplier.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {supplier.tradeName ? `${supplier.tradeName} (${supplier.name})` : supplier.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
