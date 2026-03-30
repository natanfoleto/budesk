"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ExpenseCategory, PaymentMethod, TransactionType } from "@prisma/client"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { SupplierSelect } from "@/components/suppliers/supplier-select"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FileUploader } from "@/components/ui/file-uploader"
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
import { EXPENSE_CATEGORY_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/constants"
import { formatCentsToReal } from "@/lib/utils"
import { Transaction } from "@/types/financial"

// Returns current datetime in local timezone formatted for datetime-local input: "YYYY-MM-DDTHH:MM"
function getLocalDatetimeString() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
}

const formSchema = z.object({
  description: z.string().min(1, "Descrição obrigatória"),
  valueInCents: z.number().min(1, "Valor obrigatório"),
  type: z.nativeEnum(TransactionType),
  category: z.nativeEnum(ExpenseCategory),
  paymentMethod: z.nativeEnum(PaymentMethod),
  date: z.string(), // ISO datetime string (datetime-local input)
  supplierId: z.string().nullable().optional(),
  attachmentUrl: z.string().nullable().optional(),
  conciled: z.boolean(),
})

type TransactionFormData = z.infer<typeof formSchema>

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
      valueInCents: 0,
      type: TransactionType.SAIDA,
      category: ExpenseCategory.OUTROS,
      paymentMethod: PaymentMethod.PIX,
      date: getLocalDatetimeString(),
      supplierId: null,
      attachmentUrl: null,
      conciled: false,
    },
  })

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          description: initialData.description || "",
          valueInCents: initialData.valueInCents || 0,
          type: (initialData.type as TransactionType) || TransactionType.SAIDA,
          category: (initialData.category as ExpenseCategory) || ExpenseCategory.OUTROS,
          paymentMethod: (initialData.paymentMethod as PaymentMethod) || PaymentMethod.PIX,
          date: initialData.date ? (() => { const d = new Date(initialData.date); const pad = (n: number) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}` })() : getLocalDatetimeString(),
          supplierId: initialData.supplierId || null,
          attachmentUrl: initialData.attachmentUrl || null,
          conciled: initialData.conciled || false,
        })
      } else {
        form.reset({
          description: "",
          valueInCents: 0,
          type: TransactionType.SAIDA,
          category: ExpenseCategory.OUTROS,
          paymentMethod: PaymentMethod.PIX,
          date: getLocalDatetimeString(),
          supplierId: null,
          attachmentUrl: null,
          conciled: false,
        })
      }
    }
  }, [initialData, form, open])

  const handleSubmit = (values: TransactionFormData) => {
    onSubmit(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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

            <FormField
              name="supplierId"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fornecedor (Opcional)</FormLabel>
                  <FormControl>
                    <SupplierSelect 
                      value={field.value} 
                      onChange={(val) => field.onChange(val)} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="valueInCents"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
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
                    <FormLabel>Data e Horário</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
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
                        <SelectItem value={TransactionType.ENTRADA}>Entrada</SelectItem>
                        <SelectItem value={TransactionType.SAIDA}>Saída</SelectItem>
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(ExpenseCategory).map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {EXPENSE_CATEGORY_LABELS[cat]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      {Object.values(PaymentMethod).map((method) => (
                        <SelectItem key={method} value={method}>
                          {PAYMENT_METHOD_LABELS[method]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="attachmentUrl"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comprovante / Anexo</FormLabel>
                  <FormControl>
                    <FileUploader 
                      value={field.value} 
                      onChange={(url) => field.onChange(url)} 
                      folder="financial" 
                    />
                  </FormControl>
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
