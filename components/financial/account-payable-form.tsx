import { zodResolver } from "@hookform/resolvers/zod"
import { PaymentMethod } from "@prisma/client"
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
import { AccountPayable } from "@/types/financial"

const formSchema = z.object({
  description: z.string().min(1, "Descrição obrigatória"),
  totalValueInCents: z.number().min(1, "Valor total obrigatório"),
  paymentMethod: z.nativeEnum(PaymentMethod),
  installmentsCount: z.number().min(1, "Mínimo de 1 parcela"),
  firstDueDate: z.string().min(1, "Data de vencimento obrigatória"),
  supplierId: z.string().optional().nullable(),
})

type AccountPayableFormData = z.infer<typeof formSchema>

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
      totalValueInCents: 0,
      paymentMethod: PaymentMethod.BOLETO,
      installmentsCount: 1,
      firstDueDate: new Date().toISOString().split("T")[0],
      supplierId: null,
    },
  })

  useEffect(() => {
    if (initialData) {
      form.reset({
        description: initialData.description || "",
        totalValueInCents: initialData.totalValueInCents || 0,
        paymentMethod: (initialData.paymentMethod as PaymentMethod) || PaymentMethod.BOLETO,
        installmentsCount: initialData.installmentsCount || 1,
        firstDueDate: initialData.installments?.[0]?.dueDate 
          ? new Date(initialData.installments[0].dueDate).toISOString().split("T")[0] 
          : new Date().toISOString().split("T")[0],
        supplierId: initialData.supplier?.id || null,
      })
    } else {
      form.reset({
        description: "",
        totalValueInCents: 0,
        paymentMethod: PaymentMethod.BOLETO,
        installmentsCount: 1,
        firstDueDate: new Date().toISOString().split("T")[0],
        supplierId: null,
      })
    }
  }, [initialData, form, open])

  const handleSubmit = (values: AccountPayableFormData) => {
    onSubmit(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
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
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="totalValueInCents"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Total</FormLabel>
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
                        <SelectItem value="BOLETO">Boleto</SelectItem>
                        <SelectItem value="CHEQUE">Cheque</SelectItem>
                        <SelectItem value="CARTAO">Cartão</SelectItem>
                        <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                        <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
                        <SelectItem value="PIX">PIX</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
