"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { type Resolver, useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useEmployees } from "@/hooks/use-employees"
import { ThirteenthFormData } from "@/types/rh"

const schema = z.object({
  employeeId: z.string().min(1, "Obrigatório"),
  anoReferencia: z.coerce.number().min(2000).max(2100),
  mesesTrabalhados: z.coerce.number().min(1).max(12),
})

interface ThirteenthFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: ThirteenthFormData) => void
  isLoading?: boolean
}

export function ThirteenthForm({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: ThirteenthFormProps) {
  const { data: employees } = useEmployees()

  const form = useForm<ThirteenthFormData>({
    resolver: zodResolver(schema) as unknown as Resolver<ThirteenthFormData>,
    defaultValues: {
      employeeId: "",
      anoReferencia: new Date().getFullYear(),
      mesesTrabalhados: 12,
    },
  })

  // Only used for creation (generation)
  useEffect(() => {
    if (open) {
      form.reset({
        employeeId: "",
        anoReferencia: new Date().getFullYear(),
        mesesTrabalhados: 12,
      })
    }
  }, [open, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gerar 13º Salário</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Funcionário</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um funcionário" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees?.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="anoReferencia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ano Referência</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mesesTrabalhados"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meses Trabalhados</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="12" {...field} />
                    </FormControl>
                    <div className="text-xs text-muted-foreground mt-1 text-right">
                      Max: 12
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Gerando..." : "Gerar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
