"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { type Resolver,useForm } from "react-hook-form"
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
import { AttendanceFormData } from "@/types/rh"

const schema = z.object({
  employeeId: z.string().min(1, "Obrigatório"),
  data: z.string().min(1, "Obrigatório"),
  tipo: z.enum(["PRESENCA", "FALTA", "FALTA_JUSTIFICADA", "ATESTADO"]),
  horasTrabalhadas: z.coerce.number().optional(),
  horasExtras: z.coerce.number().optional(),
  observacao: z.string().optional(),
})

interface AttendanceFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: AttendanceFormData) => void
  isLoading?: boolean
}

export function AttendanceForm({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: AttendanceFormProps) {
  const { data: employees } = useEmployees()

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema) as unknown as Resolver<z.infer<typeof schema>>,
    defaultValues: {
      employeeId: "",
      data: new Date().toISOString().split("T")[0],
      tipo: "PRESENCA",
      horasTrabalhadas: 8,
      horasExtras: 0,
      observacao: "",
    },
  })

  // Only used for creation (generation)
  useEffect(() => {
    if (open) {
      form.reset({
        employeeId: "",
        data: new Date().toISOString().split("T")[0],
        tipo: "PRESENCA",
        horasTrabalhadas: 8,
        horasExtras: 0,
        observacao: "",
      })
    }
  }, [open, form])

  const watchTipo = form.watch("tipo")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Lançar Frequência</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => onSubmit(data as AttendanceFormData))} className="space-y-4">
            
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
                name="data"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status / Ocorrência</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PRESENCA">Presença Normal</SelectItem>
                        <SelectItem value="FALTA">Falta Injustificada</SelectItem>
                        <SelectItem value="FALTA_JUSTIFICADA">Falta Justificada</SelectItem>
                        <SelectItem value="ATESTADO">Atestado Médico</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {watchTipo === "PRESENCA" && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="horasTrabalhadas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horas Trabalhadas</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="horasExtras"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horas Extras Diárias</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="observacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Justificativa / Observação</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Opcional..." />
                  </FormControl>
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
                {isLoading ? "Lançando..." : "Lançar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
