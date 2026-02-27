"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { Resolver,useForm } from "react-hook-form"
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
import { Switch } from "@/components/ui/switch"
import { useEmployees } from "@/hooks/use-employees"
import { formatCentsToReal } from "@/lib/utils"
import { RHPayment, RHPaymentFormData } from "@/types/rh"

const schema = z.object({
  employeeId: z.string().min(1, "Obrigatório"),
  competencia: z.string().regex(/^\d{4}-\d{2}$/, "Formato: YYYY-MM"),
  tipoPagamento: z.enum([
    "SALARIO", "DIARIA", "COMISSAO", "BONUS", "RESCISAO", "FERIAS", "DECIMO_TERCEIRO"
  ]),
  salarioBase: z.coerce.number().min(0),
  adicionais: z.coerce.number().min(0).default(0),
  horasExtras: z.coerce.number().min(0).default(0),
  valorHorasExtras: z.coerce.number().min(0).default(0),
  descontos: z.coerce.number().min(0).default(0),
  valorAdiantamentos: z.coerce.number().min(0).default(0),
  status: z.enum(["SIMULADO", "PENDENTE", "PAGO", "CANCELADO"]),
  dataPagamento: z.string().optional(),
  formaPagamento: z.string().optional(),
  centroCusto: z.string().optional(),
  observacoes: z.string().optional(),
})

interface PaymentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: RHPayment | null
  onSubmit: (data: RHPaymentFormData) => void
  isLoading?: boolean
}

export function PaymentForm({
  open,
  onOpenChange,
  initialData,
  onSubmit,
  isLoading,
}: PaymentFormProps) {
  const { data: employees } = useEmployees()

  const form = useForm<RHPaymentFormData>({
    resolver: zodResolver(schema) as unknown as Resolver<z.infer<typeof schema>>,
    defaultValues: {
      employeeId: "",
      competencia: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
      tipoPagamento: "SALARIO",
      salarioBase: 0,
      adicionais: 0,
      horasExtras: 0,
      valorHorasExtras: 0,
      descontos: 0,
      valorAdiantamentos: 0,
      status: "PENDENTE",
      dataPagamento: new Date().toISOString().split("T")[0],
      formaPagamento: "TRANSFERENCIA",
      centroCusto: "",
      observacoes: "",
    },
  })

  useEffect(() => {
    if (initialData) {
      form.reset({
        employeeId: initialData.employeeId,
        competencia: initialData.competencia,
        tipoPagamento: initialData.tipoPagamento,
        salarioBase: Number(initialData.salarioBase),
        adicionais: Number(initialData.adicionais),
        horasExtras: Number(initialData.horasExtras),
        valorHorasExtras: Number(initialData.valorHorasExtras),
        descontos: Number(initialData.descontos),
        valorAdiantamentos: Number(initialData.valorAdiantamentos),
        status: initialData.status,
        dataPagamento: initialData.dataPagamento
          ? new Date(initialData.dataPagamento).toISOString().split("T")[0]
          : "",
        formaPagamento: initialData.formaPagamento || "",
        centroCusto: initialData.centroCusto || "",
        observacoes: initialData.observacoes || "",
      })
    } else {
      form.reset({
        employeeId: "",
        competencia: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
        tipoPagamento: "SALARIO",
        salarioBase: 0,
        adicionais: 0,
        horasExtras: 0,
        valorHorasExtras: 0,
        descontos: 0,
        valorAdiantamentos: 0,
        status: "PENDENTE",
        dataPagamento: new Date().toISOString().split("T")[0],
        formaPagamento: "TRANSFERENCIA",
        centroCusto: "",
        observacoes: "",
      })
    }
  }, [initialData, form])

  const watchProps = form.watch()
  const total = Number(watchProps.salarioBase) + Number(watchProps.adicionais) + Number(watchProps.valorHorasExtras) 
              - Number(watchProps.descontos) - Number(watchProps.valorAdiantamentos)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Editar Pagamento" : "Novo Pagamento"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <div className="flex items-center space-x-2 bg-secondary p-3 rounded-md">
              <Switch
                checked={form.watch("status") === "SIMULADO"}
                onCheckedChange={(c) => form.setValue("status", c ? "SIMULADO" : "PENDENTE")}
              />
              <FormLabel className="font-semibold text-primary">Modo Simulação (Não gera transação financeira)</FormLabel>
            </div>

            <div className="grid grid-cols-2 gap-4">
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

              <FormField
                control={form.control}
                name="competencia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Competência (YYYY-MM)</FormLabel>
                    <FormControl>
                      <Input placeholder="2024-05" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipoPagamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Pagamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SALARIO">Salário</SelectItem>
                        <SelectItem value="DIARIA">Diária</SelectItem>
                        <SelectItem value="COMISSAO">Comissão</SelectItem>
                        <SelectItem value="BONUS">Bônus</SelectItem>
                        <SelectItem value="RESCISAO">Rescisão</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataPagamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Base</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <hr />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="salarioBase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Base (R$)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="R$ 0,00"
                        value={form.watch("salarioBase") === 0 ? "" : formatCentsToReal(Math.round(Number(field.value || 0) * 100))}
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

              <FormField
                control={form.control}
                name="adicionais"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adicionais (R$)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="R$ 0,00"
                        value={form.watch("adicionais") === 0 ? "" : formatCentsToReal(Math.round(Number(field.value || 0) * 100))}
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="horasExtras"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horas Extras (h)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="valorHorasExtras"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Horas Extras (R$)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="R$ 0,00"
                        value={form.watch("valorHorasExtras") === 0 ? "" : formatCentsToReal(Math.round(Number(field.value || 0) * 100))}
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
            </div>

            <div className="grid grid-cols-2 gap-4 text-destructive">
              <FormField
                control={form.control}
                name="descontos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descontos Gerais (R$)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="R$ 0,00"
                        value={form.watch("descontos") === 0 ? "" : formatCentsToReal(Math.round(Number(field.value || 0) * 100))}
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
              <FormField
                control={form.control}
                name="valorAdiantamentos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adiantamento/Vale (R$)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="R$ 0,00"
                        value={form.watch("valorAdiantamentos") === 0 ? "" : formatCentsToReal(Math.round(Number(field.value || 0) * 100))}
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
            </div>
            
            <div className="bg-primary/10 p-4 rounded-md flex justify-between items-center text-lg font-bold">
              <span>Líquido a Pagar</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                {isLoading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
