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
  dueDate: z.string(),
  status: z.enum(["PENDENTE", "PAGA", "ATRASADA"]),
})

type AccountPayableFormData = z.infer<typeof formSchema>

interface AccountPayableFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: AccountPayableFormData) => void
  initialData?: Partial<AccountPayableFormData & { id: string; amount: number | string; dueDate: string | Date }>
  isLoading?: boolean
}

export function AccountPayableForm({ open, onOpenChange, onSubmit, initialData, isLoading }: AccountPayableFormProps) {
  const form = useForm<AccountPayableFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      amount: 0,
      dueDate: new Date().toISOString().split("T")[0],
      status: "PENDENTE",
    },
  })

  useEffect(() => {
    if (initialData) {
      form.reset({
        description: initialData.description || "",
        amount: Number(initialData.amount) || 0,
        dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        status: initialData.status || "PENDENTE",
      })
    } else {
      form.reset({
        description: "",
        amount: 0,
        dueDate: new Date().toISOString().split("T")[0],
        status: "PENDENTE",
      })
    }
  }, [initialData, form])

  const handleSubmit = (values: AccountPayableFormData) => {
    onSubmit(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
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
                name="dueDate"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vencimento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              name="status"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PENDENTE">Pendente</SelectItem>
                      <SelectItem value="PAGA">Paga</SelectItem>
                      <SelectItem value="ATRASADA">Atrasada</SelectItem>
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
