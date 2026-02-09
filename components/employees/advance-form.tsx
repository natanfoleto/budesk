"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
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
import { formatCentsToReal } from "@/lib/utils"

const formSchema = z.object({
  valueInCents: z.number().min(0.01, "Valor inválido"),
  date: z.string(),
  note: z.string().optional(),
  payrollReference: z.string().optional(), // MM/YYYY
  paymentMethod: z.enum(["DINHEIRO", "PIX", "CARTAO", "BOLETO", "CHEQUE", "TRANSFERENCIA"]),
})

type AdvanceFormData = z.infer<typeof formSchema>

interface AdvanceFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: AdvanceFormData) => void
  onDelete?: () => void
  initialData?: AdvanceFormData
  isLoading?: boolean
}

export function AdvanceForm({ open, onOpenChange, onSubmit, onDelete, initialData, isLoading }: AdvanceFormProps) {
  const form = useForm<AdvanceFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      valueInCents: 0,
      date: new Date().toISOString().split("T")[0],
      note: "",
      payrollReference: "",
      paymentMethod: "TRANSFERENCIA",
    },
  })

  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        date: initialData.date ? new Date(initialData.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      })
    } else {
      form.reset({
        valueInCents: 0,
        date: new Date().toISOString().split("T")[0],
        note: "",
        payrollReference: "",
        paymentMethod: "TRANSFERENCIA",
      })
    }
  }, [initialData, form])

  const handleSubmit = (values: AdvanceFormData) => {
    onSubmit(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-1/2">
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar Adiantamento" : "Novo Adiantamento"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="valueInCents"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor do Adiantamento</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="R$ 0,00"
                        value={formatCentsToReal(field.value)}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "")
                          field.onChange(Number(value))
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="date"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data do Pagamento</FormLabel>
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
                name="payrollReference"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referência (MM/AAAA)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: 02/2024" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="paymentMethod"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meio de Pagamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="cursor-pointer w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DINHEIRO" className="cursor-pointer">Dinheiro</SelectItem>
                        <SelectItem value="PIX" className="cursor-pointer">Pix</SelectItem>
                        <SelectItem value="TRANSFERENCIA" className="cursor-pointer">Transferência</SelectItem>
                        <SelectItem value="CHEQUE" className="cursor-pointer">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              name="note"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observação</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Detalhes opcionais..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              {initialData && onDelete && (
                <Button 
                  type="button" 
                  variant="destructive" 
                  className="w-1/3 cursor-pointer" 
                  onClick={onDelete}
                  disabled={isLoading}
                >
                  Excluir e Estornar
                </Button>
              )}
              <Button type="submit" className="flex-1 cursor-pointer" disabled={isLoading}>
                {isLoading ? (initialData ? "Atualizando..." : "Confirmar Adiantamento e Saída de Caixa") : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
