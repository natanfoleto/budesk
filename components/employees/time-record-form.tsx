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
  date: z.string(),
  entryTime: z.string().min(1, "Horário de entrada obrigatório"),
  exitTime: z.string().optional(),
  absent: z.boolean().default(false),
  justification: z.string().optional(),
  manualWorkedHours: z.coerce.number().optional(),
  manualOvertime: z.coerce.number().optional(),
})

type TimeRecordFormData = z.infer<typeof formSchema>

interface TimeRecordFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: TimeRecordFormData) => void
  isLoading?: boolean
}

export function TimeRecordForm({ open, onOpenChange, onSubmit, isLoading }: TimeRecordFormProps) {
  const form = useForm<TimeRecordFormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      entryTime: "08:00",
      exitTime: "17:00",
      absent: false,
      justification: "",
    },
  })

  // Hack combine date + time for ISO string if API expects full DateTime,
  // But our API expects separate `date`, `entryTime` (DateTime), `exitTime` (DateTime).
  // The API logic `new Date(entryTime)` works if entryTime is "YYYY-MM-DDTHH:mm".
  // So we should construct the DateTime string before submitting.

  const handleSubmit = (values: TimeRecordFormData) => {
    // Construct full ISO strings for API
    const entryDateTime = `${values.date}T${values.entryTime}:00`
    const exitDateTime = values.exitTime ? `${values.date}T${values.exitTime}:00` : undefined

    onSubmit({
      ...values,
      entryTime: entryDateTime,
      exitTime: exitDateTime as string, // Cast or undefined
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Ponto Manual</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="entryTime"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entrada</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="exitTime"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Saída</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              name="absent"
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
                      Falta / Ausência
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              name="justification"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Justificativa / Observação</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <div>
                <h4 className="mb-2 text-sm font-medium">Ajuste Manual (Opcional)</h4>
                <FormField
                  name="manualWorkedHours"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horas Trabalhadas</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1" 
                          placeholder="Auto"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="mt-7">
                <FormField
                  name="manualOvertime"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horas Extras</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1"
                          placeholder="Auto" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Button type="submit" className="w-full cursor-pointer" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Registrar"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
