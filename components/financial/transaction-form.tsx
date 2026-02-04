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

const formSchema = z.object({
  description: z.string().min(1, "Descrição obrigatória"),
  amount: z.number().min(0.01, "Valor inválido"),
  type: z.enum(["ENTRADA", "SAIDA"]),
  category: z.string().min(1, "Categoria obrigatória"),
  paymentMethod: z.enum(["DINHEIRO", "PIX", "CARTAO", "BOLETO", "CHEQUE", "TRANSFERENCIA"]),
  date: z.string(),
})

type TransactionFormData = z.infer<typeof formSchema>

import { Transaction } from "@/types/financial"

interface TransactionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: TransactionFormData) => void
  initialData?: Transaction | null
  isLoading?: boolean
}

export function TransactionForm({ open, onOpenChange, onSubmit, initialData, isLoading }: TransactionFormProps) {
  const form = useForm<TransactionFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      amount: 0,
      type: "SAIDA",
      category: "",
      paymentMethod: "PIX",
      date: new Date().toISOString().split("T")[0],
    },
  })

  useEffect(() => {
    if (initialData) {
      form.reset({
        description: initialData.description || "",
        amount: Number(initialData.amount) || 0,
        type: initialData.type || "SAIDA",
        category: initialData.category || "",
        paymentMethod: (initialData.paymentMethod as any) || "PIX",
        date: initialData.date ? new Date(initialData.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      })
    } else {
      form.reset({
        description: "",
        amount: 0,
        type: "SAIDA",
        category: "",
        paymentMethod: "PIX",
        date: new Date().toISOString().split("T")[0],
      })
    }
  }, [initialData, form])

  const handleSubmit = (values: TransactionFormData) => {
    onSubmit(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar Transação" : "Nova Transação"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              name="description"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="amount"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                    <FormLabel>Data</FormLabel>
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
                name="type"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ENTRADA">Entrada</SelectItem>
                        <SelectItem value="SAIDA">Saída</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="category"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Alimentação, Combustível" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              name="paymentMethod"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método de Pagamento</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                      <SelectItem value="PIX">Pix</SelectItem>
                      <SelectItem value="CARTAO">Cartão</SelectItem>
                      <SelectItem value="BOLETO">Boleto</SelectItem>
                      <SelectItem value="CHEQUE">Cheque</SelectItem>
                      <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
