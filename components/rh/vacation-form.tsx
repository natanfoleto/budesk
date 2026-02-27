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
import { formatCentsToReal } from "@/lib/utils"
import { Vacation, VacationFormData } from "@/types/rh"

const schema = z.object({
  employeeId: z.string().min(1, "Obrigatório"),
  periodoAquisitivoInicio: z.string().min(1, "Obrigatório"),
  periodoAquisitivoFim: z.string().min(1, "Obrigatório"),
  diasDireito: z.coerce.number().min(1),
  diasUtilizados: z.coerce.number().min(0).default(0),
  dataInicio: z.string().optional().or(z.literal("")),
  dataFim: z.string().optional().or(z.literal("")),
  valorFerias: z.coerce.number().optional(),
  status: z.enum(["PREVISTA", "APROVADA", "GOZADA", "PAGA"]),
})

interface VacationFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Vacation | null
  onSubmit: (data: VacationFormData) => void
  isLoading?: boolean
}

export function VacationForm({
  open,
  onOpenChange,
  initialData,
  onSubmit,
  isLoading,
}: VacationFormProps) {
  const { data: employees } = useEmployees()

  const defaultStart = new Date()
  defaultStart.setFullYear(defaultStart.getFullYear() - 1)
  
  const defaultEnd = new Date()

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema) as unknown as Resolver<z.infer<typeof schema>>,
    defaultValues: {
      employeeId: "",
      periodoAquisitivoInicio: defaultStart.toISOString().split("T")[0],
      periodoAquisitivoFim: defaultEnd.toISOString().split("T")[0],
      diasDireito: 30,
      diasUtilizados: 0,
      dataInicio: "",
      dataFim: "",
      valorFerias: 0,
      status: "PREVISTA",
    },
  })

  useEffect(() => {
    if (initialData) {
      form.reset({
        employeeId: initialData.employeeId,
        periodoAquisitivoInicio: initialData.periodoAquisitivoInicio
          ? new Date(initialData.periodoAquisitivoInicio).toISOString().split("T")[0]
          : "",
        periodoAquisitivoFim: initialData.periodoAquisitivoFim
          ? new Date(initialData.periodoAquisitivoFim).toISOString().split("T")[0]
          : "",
        diasDireito: Number(initialData.diasDireito),
        diasUtilizados: Number(initialData.diasUtilizados),
        dataInicio: initialData.dataInicio
          ? new Date(initialData.dataInicio).toISOString().split("T")[0]
          : "",
        dataFim: initialData.dataFim
          ? new Date(initialData.dataFim).toISOString().split("T")[0]
          : "",
        valorFerias: initialData.valorFerias ? Number(initialData.valorFerias) : 0,
        status: initialData.status as "PREVISTA" | "APROVADA" | "GOZADA" | "PAGA",
      })
    } else {
      form.reset({
        employeeId: "",
        periodoAquisitivoInicio: defaultStart.toISOString().split("T")[0],
        periodoAquisitivoFim: defaultEnd.toISOString().split("T")[0],
        diasDireito: 30,
        diasUtilizados: 0,
        dataInicio: "",
        dataFim: "",
        valorFerias: 0,
        status: "PREVISTA",
      })
    }
  }, [initialData, form])

  const watchValor = form.watch("valorFerias") || 0
  const adicional = Number(watchValor) / 3

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Editar Férias" : "Agendar Férias"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => onSubmit(data as unknown as VacationFormData))} className="space-y-4">
            
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Funcionário</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
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

            <div className="grid grid-cols-2 gap-4 bg-muted p-3 rounded">
              <span className="col-span-2 font-semibold text-sm">Período Aquisitivo</span>
              <FormField
                control={form.control}
                name="periodoAquisitivoInicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Início</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="periodoAquisitivoFim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fim</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="diasDireito"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dias de Direito</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="diasUtilizados"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dias Utilizados</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 bg-muted p-3 rounded">
              <span className="col-span-2 font-semibold text-sm">Gozos / Período Concessivo</span>
              <FormField
                control={form.control}
                name="dataInicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Início</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dataFim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fim</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valorFerias"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Bruto (S/ 1/3) R$</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="R$ 0,00"
                        value={form.watch("valorFerias") === 0 ? "" : formatCentsToReal(Math.round(Number(field.value || 0) * 100))}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "")
                          field.onChange(Number(value) / 100)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col justify-end pb-2 text-sm text-muted-foreground">
                 1/3 Calculado: <strong className="text-foreground">R$ {adicional.toFixed(2)}</strong>
              </div>
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PREVISTA">Prevista</SelectItem>
                      <SelectItem value="APROVADA">Aprovada</SelectItem>
                      <SelectItem value="GOZADA">Gozada</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                {isLoading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
