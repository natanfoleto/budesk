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
import { EmployeeWithDetails } from "@/types/employee"
import { formatCentsToReal, maskCPF, maskPhone } from "@/lib/utils"

const formSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  document: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  role: z.string().min(1, "Cargo obrigatório"),
  salaryInCents: z.coerce.number().min(0, "Salário inválido"),
  shirtSize: z.string().optional(),
  pantsSize: z.string().optional(),
  shoeSize: z.string().optional(),
})

type EmployeeFormData = z.infer<typeof formSchema>

interface EmployeeFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: EmployeeFormData) => void
  initialData?: EmployeeWithDetails
  isLoading?: boolean
}

export function EmployeeForm({ open, onOpenChange, onSubmit, initialData, isLoading }: EmployeeFormProps) {
  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: "",
      document: "",
      email: "",
      phone: "",
      role: "",
      salaryInCents: 0,
      shirtSize: "",
      pantsSize: "",
      shoeSize: "",
    },
  })

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || "",
        document: initialData.document || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        role: initialData.role || "",
        salaryInCents: Number(initialData.salaryInCents) || 0,
        shirtSize: initialData.shirtSize || "",
        pantsSize: initialData.pantsSize || "",
        shoeSize: initialData.shoeSize || "",
      })
    } else {
      form.reset({
        name: "",
        document: "",
        email: "",
        phone: "",
        role: "",
        salaryInCents: 0,
        shirtSize: "",
        pantsSize: "",
        shoeSize: "",
      })
    }
  }, [initialData, form])

  const handleSubmit = (values: EmployeeFormData) => {
    onSubmit(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar Funcionário" : "Novo Funcionário"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="name"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="document"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="000.000.000-00"
                        maxLength={14}
                        onChange={(e) => field.onChange(maskCPF(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="role"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo/Função Atual</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="salaryInCents"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salário Base (Atual)</FormLabel>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="email"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="phone"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                        onChange={(e) => field.onChange(maskPhone(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                name="shirtSize"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tamanho Camisa</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="cursor-pointer">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="P" className="cursor-pointer">P</SelectItem>
                        <SelectItem value="M" className="cursor-pointer">M</SelectItem>
                        <SelectItem value="G" className="cursor-pointer">G</SelectItem>
                        <SelectItem value="GG" className="cursor-pointer">GG</SelectItem>
                        <SelectItem value="XGG" className="cursor-pointer">XGG</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="pantsSize"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tamanho Calça</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: 40 ou M" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="shoeSize"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tamanho Calçado</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: 41" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full cursor-pointer" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
