"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { type Resolver, useForm } from "react-hook-form"
import { toast } from "sonner"

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
  FormDescription,
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
import { Textarea } from "@/components/ui/textarea"
import { formatCentsToReal } from "@/lib/utils"
import { Maintenance } from "@/types/vehicle"

import {
  MaintenanceFormData,
  MaintenancePriority,
  MaintenancePriorityLabels,
  maintenanceSchema,
  MaintenanceStatus,
  MaintenanceStatusLabels,
  MaintenanceType,
  MaintenanceTypeLabels,
} from "./maintenance-schema"

interface MaintenanceFormProps {
  vehicleId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Maintenance
  onSuccess?: () => void
  onSubmit?: (data: MaintenanceFormData) => void
  isLoading?: boolean
}

export function MaintenanceForm({
  vehicleId,
  open,
  onOpenChange,
  initialData,
  onSuccess,
  onSubmit, 
  isLoading: externalIsLoading,
}: MaintenanceFormProps) {
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await fetch("/api/suppliers")
        if (response.ok) {
          const data = await response.json()
          setSuppliers(data)
        }
      } catch (error) {
        console.error("Error fetching suppliers:", error)
      }
    }
    fetchSuppliers()
  }, [])

  const form = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema) as Resolver<MaintenanceFormData>,
    defaultValues: {
      type: MaintenanceType.PREVENTIVA,
      category: "",
      description: "",
      priority: MaintenancePriority.MEDIA,
      scheduledDate: new Date().toISOString().split("T")[0],
      isRecurrent: false,
      status: MaintenanceStatus.PENDENTE,
      estimatedCost: 0,
      intervalKm: null,
      intervalDays: null,
      internalNotes: "",
      approvalResponsible: "",
      costCenter: "",
      invoiceNumber: "",
      operationalImpact: "BAIXO",
      downtimeDays: 0,
      isPaid: false,
    },
  })

  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        scheduledDate: new Date(initialData.scheduledDate).toISOString().split("T")[0],
        completedDate: initialData.completedDate ? new Date(initialData.completedDate).toISOString().split("T")[0] : undefined,
        estimatedCost: initialData.estimatedCost,
        finalCost: initialData.finalCost,
        isPaid: initialData.isPaid,
      } as unknown as MaintenanceFormData)
    } else {
      form.reset({
        type: MaintenanceType.PREVENTIVA,
        category: "",
        description: "",
        priority: MaintenancePriority.MEDIA,
        scheduledDate: new Date().toISOString().split("T")[0],
        isRecurrent: false,
        status: MaintenanceStatus.PENDENTE,
        estimatedCost: 0,
        isPaid: false,
      })
    }
  }, [initialData, form, open])

  const isLoading = externalIsLoading || form.formState.isSubmitting
  const status = form.watch("status")
  const isRecurrent = form.watch("isRecurrent")

  const handleSubmit = async (data: MaintenanceFormData) => {
    if (onSubmit) {
      await onSubmit(data)
    } else {
      try {
        const url = initialData
          ? `/api/vehicles/${vehicleId}/maintenances/${initialData.id}`
          : `/api/vehicles/${vehicleId}/maintenances`
        const method = initialData ? "PUT" : "POST"

        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          const result = await response.json()
          throw new Error(result.error || "Erro ao salvar manutenção")
        }

        toast.success("Manutenção salva com sucesso")
        if (onSuccess) onSuccess()
        onOpenChange(false)
      } catch (error) {
        console.error(error)
        toast.error(error instanceof Error ? error.message : "Erro desconhecido")
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Editar Manutenção" : "Nova Manutenção"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            
            {/* IDENTIFICAÇÃO */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(MaintenanceType).map((type) => (
                          <SelectItem key={type} value={type}>{MaintenanceTypeLabels[type]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(MaintenanceStatus).map((s) => (
                          <SelectItem key={s} value={s}>{MaintenanceStatusLabels[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} placeholder="Ex: Troca de Óleo, Pneus..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(MaintenancePriority).map((p) => (
                          <SelectItem key={p} value={p}>{MaintenancePriorityLabels[p]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição Detalhada</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ""} placeholder="Descreva o serviço a ser realizado..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* DATAS E KM */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="scheduledDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Programada</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currentKm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>KM Atual (do Veículo)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value ?? ""}
                        onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* RECORRÊNCIA */}
            <div className="border rounded-lg p-4 space-y-4">
              <FormField
                control={form.control}
                name="isRecurrent"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Recorrente</FormLabel>
                      <FormDescription>Criar próxima manutenção automaticamente</FormDescription>
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
              
              {isRecurrent && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="intervalKm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Intervalo (KM)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value ?? ""}
                            onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                            placeholder="Ex: 10000"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="intervalDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Intervalo (Dias)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value ?? ""}
                            onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                            placeholder="Ex: 180"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            {/* CAMPOS DE REALIZAÇÃO */}
            {status === MaintenanceStatus.REALIZADA && (
              <div className="border border-green-200 bg-green-50 rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-green-800">Finalização do Serviço</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="completedDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Realizada</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="finalCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custo Final</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="R$ 0,00"
                            value={formatCentsToReal(field.value || 0)}
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
                
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forma de Pagamento</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || undefined}
                        defaultValue={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                          <SelectItem value="PIX">PIX</SelectItem>
                          <SelectItem value="CARTAO">Cartão</SelectItem>
                          <SelectItem value="BOLETO">Boleto</SelectItem>
                          <SelectItem value="CHEQUE">Cheque</SelectItem>
                          <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="invoiceNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nota Fiscal</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="downtimeDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tempo Parado (Dias)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value ?? ""}
                            onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* FINANCEIRO (PREVISÃO) */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="estimatedCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo Estimado</FormLabel>
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
                control={form.control}
                name="isPaid"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Debitar do Caixa</FormLabel>
                      <FormDescription>
                        Será lançada uma saída no valor estimado
                      </FormDescription>
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

              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornecedor</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione um fornecedor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {form.watch("isPaid") && (
              <div className="rounded-md bg-yellow-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Atenção</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                         Ao salvar, uma transação de SAÍDA será criada no módulo Financeiro com o valor de <strong>{formatCentsToReal(form.watch("estimatedCost") || 0)}</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="costCenter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Centro de Custo</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="approvalResponsible"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável Aprovação</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="operationalImpact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Impacto Operacional</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="BAIXO">Baixo</SelectItem>
                        <SelectItem value="MEDIO">Médio</SelectItem>
                        <SelectItem value="ALTO">Alto</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="attachments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Anexos (URLs ou Notas)</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ""} placeholder="Cole URLs de arquivos ou descreva anexos..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="internalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações Internas</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? "Salvar Alterações" : "Criar Manutenção"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
