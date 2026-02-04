"use client"

import { zodResolver } from "@hookform/resolvers/zod"
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

const formSchema = z.object({
  type: z.string().min(1, "Tipo obrigatório"),
  startDate: z.string(),
  endDate: z.string().optional(),
  value: z.coerce.number().min(0, "Valor inválido"),
  status: z.enum(["ACTIVE", "FINISHED", "TERMINATED"]),
  description: z.string().optional(),
  fileUrl: z.string().optional(),
})

type ContractFormData = z.infer<typeof formSchema>

interface ContractFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: ContractFormData) => void
  isLoading?: boolean
}

export function ContractForm({ open, onOpenChange, onSubmit, isLoading }: ContractFormProps) {
  const form = useForm<ContractFormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      type: "Prestação de Serviços",
      startDate: new Date().toISOString().split("T")[0],
      value: 0,
      status: "ACTIVE",
      description: "",
    },
  })

  const handleSubmit = (values: ContractFormData) => {
    onSubmit(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Contrato</DialogTitle>
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
                name="value"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor do Contrato</FormLabel>
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
                name="status"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="cursor-pointer">
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

            <Button type="submit" className="w-full cursor-pointer" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
