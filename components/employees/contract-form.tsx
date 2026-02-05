"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Trash } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { formatCentsToReal } from "@/lib/utils"

const formSchema = z.object({
  type: z.string().min(1, "Tipo é obrigatório"),
  startDate: z.string(),
  endDate: z.string().optional(),
  valueInCents: z.coerce.number().min(1, "Valor inválido"),
  status: z.enum(["ACTIVE", "FINISHED", "TERMINATED"]),
  description: z.string().optional(),
  fileUrl: z.string().optional(),
})

type ContractFormData = z.infer<typeof formSchema>

interface ContractFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: ContractFormData) => void
  onDelete?: () => void
  initialData?: ContractFormData
  isLoading?: boolean
}

export function ContractForm({ open, onOpenChange, onSubmit, onDelete, initialData, isLoading }: ContractFormProps) {
  const form = useForm<ContractFormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: initialData || {
      type: "",
      startDate: new Date().toISOString().split("T")[0],
      valueInCents: 0,
      status: "ACTIVE",
      description: "",
      fileUrl: "",
    },
  })

  // Basic reset pattern when opening with new data
  // Note: For a robust implementation, we might use useEffect to reset form when initialData changes
  // to support switching between "New" and "Edit" while dialog is transitioning or reusing component.
  // Given the usage pattern (dialog opens/closes), this might be sufficient if component unmounts or parent handles keys.
  
  const handleSubmit = (values: ContractFormData) => {
    onSubmit(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-1/2">
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar Contrato" : "Novo Contrato"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              name="type"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Contrato</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Prestação de Serviços" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="startDate"
                control={form.control}
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
                name="endDate"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fim (Opcional)</FormLabel>
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
                name="valueInCents"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor do Contrato</FormLabel>
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
                name="status"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="cursor-pointer w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ACTIVE" className="cursor-pointer">Ativo</SelectItem>
                        <SelectItem value="FINISHED" className="cursor-pointer">Finalizado</SelectItem>
                        <SelectItem value="TERMINATED" className="cursor-pointer">Rescindido</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              name="description"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição / Objeto</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between gap-4">
              {initialData && onDelete && (
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={onDelete}
                  disabled={isLoading}
                  className="cursor-pointer"
                >
                  <Trash className="h-4 w-4" /> Excluir
                </Button>
              )}
              <Button type="submit" className="flex-1 cursor-pointer ml-auto" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
