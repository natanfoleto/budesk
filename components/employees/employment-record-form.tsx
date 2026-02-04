"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Textarea } from "@/components/ui/textarea"

const formSchema = z.object({
  admissionDate: z.string(),
  terminationDate: z.string().optional(),
  jobTitle: z.string().min(1, "Cargo obrigatório"),
  baseSalary: z.coerce.number().min(0, "Salário inválido"),
  contractType: z.string().min(1, "Tipo de contrato obrigatório"),
  weeklyWorkload: z.coerce.number().optional(),
  workRegime: z.string().optional(),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
})

type EmploymentRecordFormData = z.infer<typeof formSchema>

interface EmploymentRecordFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: EmploymentRecordFormData) => void
  isLoading?: boolean
}

export function EmploymentRecordForm({ open, onOpenChange, onSubmit, isLoading }: EmploymentRecordFormProps) {
  const form = useForm<EmploymentRecordFormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      admissionDate: new Date().toISOString().split("T")[0],
      jobTitle: "",
      baseSalary: 0,
      contractType: "CLT",
      isActive: true,
      notes: "",
    },
  })

  const handleSubmit = (values: EmploymentRecordFormData) => {
    onSubmit(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Novo Vínculo Empregatício</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="admissionDate"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Admissão</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="terminationDate"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Término</FormLabel>
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
                name="jobTitle"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo / Função</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="baseSalary"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salário Base</FormLabel>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="contractType"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Contrato</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="CLT, PJ, Estágio..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-2">
                <FormField
                  name="weeklyWorkload"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carga Horária (Semanal)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="workRegime"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Regime</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Presencial..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              name="notes"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="isActive"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Vínculo Ativo
                    </FormLabel>
                  </div>
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
