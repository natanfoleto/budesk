"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { EmployeeAccountType } from "@prisma/client"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Switch } from "@/components/ui/switch"
import { EmployeeAccountFormData } from "@/types/employee"

const formSchema = z.object({
  type: z.nativeEnum(EmployeeAccountType),
  identifier: z.string().min(1, "Identificador é obrigatório"),
  description: z.string().optional(),
  isDefault: z.boolean().default(false),
})

interface EmployeeAccountFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: EmployeeAccountFormData) => void
  onDelete?: () => void
  initialData?: EmployeeAccountFormData
  isLoading?: boolean
}

export function EmployeeAccountForm({
  open,
  onOpenChange,
  onSubmit,
  onDelete,
  initialData,
  isLoading,
}: EmployeeAccountFormProps) {
  const form = useForm<EmployeeAccountFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      type: EmployeeAccountType.PIX_CPF,
      identifier: "",
      description: "",
      isDefault: false,
    },
  })

  // Reset form when initialData changes or dialog opens
  if (open && initialData && form.getValues("identifier") !== initialData.identifier) {
    form.reset(initialData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar Conta" : "Adicionar Conta"}</DialogTitle>
          <DialogDescription>
            Insira os dados bancários ou chave PIX do funcionário.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Conta</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={EmployeeAccountType.BANCARIA}>Conta Bancária (TED/DOC)</SelectItem>
                      <SelectItem value={EmployeeAccountType.PIX_CPF}>PIX (CPF)</SelectItem>
                      <SelectItem value={EmployeeAccountType.PIX_TELEFONE}>PIX (Telefone)</SelectItem>
                      <SelectItem value={EmployeeAccountType.PIX_EMAIL}>PIX (Email)</SelectItem>
                      <SelectItem value={EmployeeAccountType.PIX_CHAVE_ALEATORIA}>PIX (Chave Aleatória)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="identifier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Identificador / Chave</FormLabel>
                  <FormControl>
                    <Input placeholder="CPF, Ag/Conta ou Chave PIX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Banco do Brasil, Pix Pessoal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Conta Principal</FormLabel>
                    <div className="text-[0.8rem] text-muted-foreground">
                      Usar esta conta como padrão para pagamentos.
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4 gap-2flex justify-end">
              {initialData && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={onDelete}
                  disabled={isLoading}
                >
                  Excluir
                </Button>
              )}

              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
