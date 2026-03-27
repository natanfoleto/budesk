"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ExpenseCategory, PaymentMethod } from "@prisma/client"
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
import { AccountPayable } from "@/types/financial"

const formSchema = z.object({
  description: z.string().min(1, "Descrição obrigatória"),
  installmentValueInCents: z.number().min(1, "Valor da parcela obrigatório"),
  totalValueInCents: z.number().optional(),
  paymentMethod: z.nativeEnum(PaymentMethod),
  category: z.nativeEnum(ExpenseCategory),
  installmentsCount: z.number().min(1, "Mínimo de 1 parcela"),
  firstDueDate: z.string().min(1, "Data de vencimento obrigatória"),
  supplierId: z.string().nullable().optional(),
  attachmentUrl: z.string().nullable().optional(),
})

export type AccountPayableFormData = z.infer<typeof formSchema>

interface AccountPayableFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: AccountPayableFormData) => void
  initialData?: AccountPayable | null
  isLoading?: boolean
}

export function AccountPayableForm({ open, onOpenChange, onSubmit, initialData, isLoading }: AccountPayableFormProps) {
  const form = useForm<AccountPayableFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      installmentValueInCents: 0,
      totalValueInCents: 0,
      paymentMethod: PaymentMethod.BOLETO,
      category: ExpenseCategory.OUTROS,
      installmentsCount: 1,
      firstDueDate: new Date().toISOString().split("T")[0],
      supplierId: null,
      attachmentUrl: null,
    },
  })

  useEffect(() => {
    if (open) {
      if (initialData) {
        const count = initialData.installmentsCount || 1
        const total = initialData.totalValueInCents || 0
        form.reset({
          description: initialData.description || "",
          installmentValueInCents: Math.floor(total / count),
          totalValueInCents: total,
          paymentMethod: (initialData.paymentMethod as PaymentMethod) || PaymentMethod.BOLETO,
          category: (initialData.category as ExpenseCategory) || ExpenseCategory.OUTROS,
          installmentsCount: count,
          firstDueDate: initialData.installments?.[0]?.dueDate 
            ? new Date(initialData.installments[0].dueDate).toISOString().split("T")[0] 
            : new Date().toISOString().split("T")[0],
          supplierId: initialData.supplierId || null,
          attachmentUrl: initialData.attachmentUrl || null,
        })
      } else {
        form.reset({
          description: "",
          installmentValueInCents: 0,
          totalValueInCents: 0,
          paymentMethod: PaymentMethod.BOLETO,
          category: ExpenseCategory.OUTROS,
          installmentsCount: 1,
          firstDueDate: new Date().toISOString().split("T")[0],
          supplierId: null,
          attachmentUrl: null,
        })
      }
    }
  }, [initialData, form, open])

  const handleSubmit = (values: AccountPayableFormData) => {
    const totalValueInCents = values.installmentValueInCents * values.installmentsCount
    onSubmit({ ...values, totalValueInCents })
  }

  const installmentValue = form.watch("installmentValueInCents") || 0
  const installmentsCount = form.watch("installmentsCount") || 1
  const calculatedTotal = installmentValue * installmentsCount

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar Conta" : "Nova Conta a Pagar"}</DialogTitle>
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
                    <Input placeholder="Ex: Aluguel, Fornecedor X..." {...field} />
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
                name="installmentValueInCents"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor da Parcela</FormLabel>
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
                name="firstDueDate"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>1º Vencimento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {installmentsCount > 1 && (
              <div className="pb-1 rounded-md text-sm text-center">
                <span className="font-bold">{formatCentsToReal(calculatedTotal)}</span>
                <span className="text-muted-foreground ml-1">({installmentsCount}x {formatCentsToReal(installmentValue)})</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="paymentMethod"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método</FormLabel>
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
                name="category"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione" />
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
              name="installmentsCount"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parcelas</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={1} 
                      {...field} 
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
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
