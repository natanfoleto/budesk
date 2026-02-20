"use client"

import { ArrowLeft, Loader2, Plus } from "lucide-react"
import Link from "next/link"
import { use, useState } from "react"

import { SecureActionDialog } from "@/components/employees/secure-action-dialog"
import { MaintenanceForm } from "@/components/fleet/maintenance-form"
import { MaintenanceList } from "@/components/fleet/maintenance-list"
import { MaintenanceFormData } from "@/components/fleet/maintenance-schema"
import { VehicleFormDialog } from "@/components/fleet/vehicle-form-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  useCreateMaintenance,
  useDeleteMaintenance,
  useUpdateMaintenance,
  useUpdateVehicle,
  useVehicle,
  useVehicleMaintenances,
} from "@/hooks/use-vehicles"
import { Maintenance, VehicleFormData, VehicleTypeLabels } from "@/types/vehicle"

export default function VehicleDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  
  // Vehicle Data
  const { data: vehicle, isLoading: isVehicleLoading } = useVehicle(id)
  const updateVehicleMutation = useUpdateVehicle()
  const [isVehicleFormOpen, setIsVehicleFormOpen] = useState(false)

  // Maintenance Data
  const { data: maintenances, isLoading: isMaintenancesLoading } = useVehicleMaintenances(id)
  const createMaintenanceMutation = useCreateMaintenance()
  const updateMaintenanceMutation = useUpdateMaintenance()
  const deleteMaintenanceMutation = useDeleteMaintenance()
  
  const [isMaintenanceFormOpen, setIsMaintenanceFormOpen] = useState(false)
  const [editingMaintenance, setEditingMaintenance] = useState<Maintenance | null>(null)
  
  // Secure Dialog State
  const [secureDialog, setSecureDialog] = useState<{
    isOpen: boolean
    title: string
    description: string
    action: () => Promise<void>
    type: "delete" | "update"
      }>({
        isOpen: false,
        title: "",
        description: "",
        action: async () => {},
        type: "delete",
      })

  // Helper to open secure dialog
  const openSecureAction = (
    title: string, 
    description: string, 
    type: "delete" | "update", 
    action: () => Promise<void>
  ) => {
    setSecureDialog({
      isOpen: true,
      title,
      description,
      type,
      action: async () => {
        await action()
      }
    })
  }

  // Handlers

  const handleUpdateVehicle = async (data: VehicleFormData) => {
    // Need to cast because `active` is boolean in data but Partial<VehicleFormData> expects boolean | undefined
    // Actually Partial<T> just makes all optional.
    await updateVehicleMutation.mutateAsync({ id, data })
    setIsVehicleFormOpen(false)
  }

  const handleMaintenanceSubmit = async (data: MaintenanceFormData) => {
    if (editingMaintenance) {
      await updateMaintenanceMutation.mutateAsync({ 
        vehicleId: id, 
        maintenanceId: editingMaintenance.id, 
        data 
      })
    } else {
      await createMaintenanceMutation.mutateAsync({ vehicleId: id, data })
    }
    setIsMaintenanceFormOpen(false)
    setEditingMaintenance(null)
  }

  const handleMaintenanceDelete = async (maintenanceId: string) => {
    openSecureAction(
      "Excluir Manutenção", 
      "Esta ação não pode ser desfeita. Isso excluirá permanentemente o registro de manutenção.", 
      "delete", 
      async () => {
        await deleteMaintenanceMutation.mutateAsync({ vehicleId: id, maintenanceId })
      }
    )
  }

  const handleMaintenanceEdit = (maintenance: Maintenance) => {
    setEditingMaintenance(maintenance)
    setIsMaintenanceFormOpen(true)
  }

  if (isVehicleLoading) {
    return (
      <div className="flex justify-center items-center h-full w-full py-10">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <p className="text-lg font-medium">Veículo não encontrado</p>
        <Link href="/fleet" className="text-primary hover:underline">
          Voltar para listagem de veículos
        </Link>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center space-x-4">
        <Link href="/fleet">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{vehicle.plate}</h2>
          <p className="text-muted-foreground">{vehicle.brand} {vehicle.model}</p>
        </div>

        <Badge className="ml-auto" variant={vehicle.active ? "default" : "secondary"}>
          {vehicle.active ? "Ativo" : "Inativo"}
        </Badge>
      </div>

      <Tabs defaultValue="dados" className="space-y-4">
        <TabsList className="w-full">
          <TabsTrigger value="dados" className="gap-2 cursor-pointer">Dados do Veículo</TabsTrigger>
          <TabsTrigger value="maintenance" className="gap-2 cursor-pointer">Manutenção</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dados" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Veículo</CardTitle>
              <CardDescription>Dados cadastrais e técnicos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium text-sm text-muted-foreground">Placa</p>
                  <p>{vehicle.plate}</p>
                </div>
                <div>
                  <p className="font-medium text-sm text-muted-foreground">Tipo</p>
                  <p>{VehicleTypeLabels[vehicle.type]}</p>
                </div>
                <div>
                  <p className="font-medium text-sm text-muted-foreground">Marca/Modelo</p>
                  <p>{vehicle.brand} - {vehicle.model}</p>
                </div>
                <div>
                  <p className="font-medium text-sm text-muted-foreground">Ano</p>
                  <p>{vehicle.year}</p>
                </div>
                <div className="col-span-2">
                  <p className="font-medium text-sm text-muted-foreground">Descrição</p>
                  <p>{vehicle.description || "-"}</p>
                </div>
              </div>
              
              <div className="mt-6">
                <Button onClick={() => setIsVehicleFormOpen(true)}>
                  Editar Veículo
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => {
              setEditingMaintenance(null)
              setIsMaintenanceFormOpen(true)
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Manutenção
            </Button>
          </div>
          
          {isMaintenancesLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <MaintenanceList 
              vehicleId={id} 
              maintenances={maintenances || []} 
              fetchMaintenances={() => {}} // No-op, managed by Query
              onEdit={handleMaintenanceEdit}
              onDelete={handleMaintenanceDelete}
            />
          )}
        </TabsContent>
      </Tabs>

      <VehicleFormDialog
        open={isVehicleFormOpen}
        onOpenChange={setIsVehicleFormOpen}
        initialData={vehicle}
        onSubmit={handleUpdateVehicle}
        isLoading={updateVehicleMutation.isPending}
        onSuccess={() => {}} // No-op
      />

      <MaintenanceForm
        vehicleId={id}
        open={isMaintenanceFormOpen}
        onOpenChange={setIsMaintenanceFormOpen}
        initialData={editingMaintenance || undefined}
        onSubmit={handleMaintenanceSubmit}
        isLoading={createMaintenanceMutation.isPending || updateMaintenanceMutation.isPending}
        onSuccess={() => {}} // No-op
      />

      <SecureActionDialog 
        open={secureDialog.isOpen} 
        onOpenChange={(open) => setSecureDialog({ ...secureDialog, isOpen: open })}
        onConfirm={secureDialog.action}
        title={secureDialog.title}
        description={secureDialog.description}
        actionType={secureDialog.type}
      />

    </div>
  )
}
