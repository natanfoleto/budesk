"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircle } from "lucide-react"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
  valueInCents: z.coerce.number().min(0.01, "Valor inválido"),
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
  isLoading?: boolean
}

export function AdvanceForm({ open, onOpenChange, onSubmit, isLoading }: AdvanceFormProps) {
  const form = useForm<AdvanceFormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      valueInCents: 0,
      date: new Date().toISOString().split("T")[0],
      note: "",
      payrollReference: "",
      paymentMethod: "TRANSFERENCIA",
    },
  })

  const handleSubmit = (values: AdvanceFormData) => {
    onSubmit(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Adiantamento</DialogTitle>
        </DialogHeader>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Atenção Financeira</AlertTitle>
          <AlertDescription>
            Este registro criará automaticamente uma transação de SAÍDA no módulo Financeiro.
          </AlertDescription>
        </Alert>

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
                        <SelectTrigger className="cursor-pointer">
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

            <Button type="submit" className="w-full cursor-pointer" disabled={isLoading}>
              {isLoading ? "Confirmar Adiantamento e Saída de Caixa" : "Salvar"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
