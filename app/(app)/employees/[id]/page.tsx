"use client"

import { 
  EmployeeAdvance,
  EmployeeContract,
  EmploymentRecord,
  FinancialTransaction
} from "@prisma/client"
import { ArrowLeft, Loader2,Plus } from "lucide-react"
import Link from "next/link"
import { use, useState } from "react"

import { AdvanceForm } from "@/components/employees/advance-form"
import { ContractForm } from "@/components/employees/contract-form"
import { EmployeeForm } from "@/components/employees/employee-form"
import { EmployeeAccountTab } from "@/components/employees/EmployeeAccountTab"
import { EmployeeTagsTab } from "@/components/employees/EmployeeTagsTab"
import { EmploymentRecordForm } from "@/components/employees/employment-record-form"
import { SecureActionDialog } from "@/components/employees/secure-action-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  useCreateEmployeeAdvance, 
  useCreateEmployeeContract, 
  useCreateEmploymentRecord,
  useDeleteEmployeeAdvance,
  useDeleteEmployeeContract,
  useDeleteEmploymentRecord,
  useEmployee,
  useEmployeeAdvances,
  useEmployeeContracts,
  useEmploymentRecords,
  useUpdateEmployee,
  useUpdateEmployeeAdvance,
  useUpdateEmployeeContract,
  useUpdateEmploymentRecord,
} from "@/hooks/use-employees"
import { formatCentsToReal, formatDate } from "@/lib/utils"
import { 
  AdvanceFormData,
  ContractFormData, 
  EmployeeFormData, 
  EmploymentRecordFormData, 
} from "@/types/employee"

export default function EmployeeProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: employee, isLoading } = useEmployee(id)
  const updateMutation = useUpdateEmployee()
  
  // Records
  const { data: records } = useEmploymentRecords(id)
  const createRecordMutation = useCreateEmploymentRecord()
  const updateRecordMutation = useUpdateEmploymentRecord()
  const deleteRecordMutation = useDeleteEmploymentRecord()
  const [isRecordFormOpen, setIsRecordFormOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<EmploymentRecord | null>(null)

  // Contracts
  const { data: contracts } = useEmployeeContracts(id)
  const createContractMutation = useCreateEmployeeContract()
  const updateContractMutation = useUpdateEmployeeContract()
  const deleteContractMutation = useDeleteEmployeeContract()
  const [isContractFormOpen, setIsContractFormOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState<EmployeeContract | null>(null)

  // Advances
  const { data: advances } = useEmployeeAdvances(id)
  const createAdvanceMutation = useCreateEmployeeAdvance()
  const updateAdvanceMutation = useUpdateEmployeeAdvance()
  const deleteAdvanceMutation = useDeleteEmployeeAdvance()
  const [isAdvanceFormOpen, setIsAdvanceFormOpen] = useState(false)
  const [selectedAdvance, setSelectedAdvance] = useState<EmployeeAdvance & { transaction: FinancialTransaction | null } | null>(null)

  // Edit Employee
  const [isEditFormOpen, setIsEditFormOpen] = useState(false)

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

  if (isLoading) return (
    <div className="flex justify-center items-center h-full w-full py-10">
      <Loader2 className="size-4 animate-spin text-muted-foreground" />
    </div>
  )
  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <p className="text-lg font-medium">Funcionário não encontrado</p>
        <Link href="/employees" className="text-primary hover:underline">
          Voltar para listagem de funcionários
        </Link>
      </div>
    )
  }

  const handleUpdateEmployee = (data: Partial<EmployeeFormData>) => {
    updateMutation.mutate({ id, data }, {
      onSuccess: () => setIsEditFormOpen(false)
    })
  }

  // --- Record Handlers ---
  const handleRecordSubmit = (data: EmploymentRecordFormData) => {
    if (selectedRecord) {
      openSecureAction("Atualizar Vínculo", "Deseja confirmar a atualização deste vínculo?", "update", async () => {
        await updateRecordMutation.mutateAsync({ employeeId: id, recordId: selectedRecord.id, data })
        setIsRecordFormOpen(false)
        setSelectedRecord(null)
      })
    } else {
      createRecordMutation.mutate({ employeeId: id, data }, {
        onSuccess: () => setIsRecordFormOpen(false)
      })
    }
  }

  const handleRecordDelete = () => {
    if (selectedRecord) {
      openSecureAction("Excluir Vínculo", "Esta ação não pode ser desfeita. Isso excluirá permanentemente o vínculo empregatício.", "delete", async () => {
        await deleteRecordMutation.mutateAsync({ employeeId: id, recordId: selectedRecord.id })
        setIsRecordFormOpen(false)
        setSelectedRecord(null)
      })
    }
  }

  const openRecordForm = (record?: EmploymentRecord) => {
    if (record) {
      setSelectedRecord(record)
    } else {
      setSelectedRecord(null)
    }
    setIsRecordFormOpen(true)
  }

  // --- Contract Handlers ---
  // --- Contract Handlers ---
  const handleContractSubmit = (data: ContractFormData) => {
    if (selectedContract) {
      openSecureAction("Atualizar Contrato", "Deseja confirmar a atualização deste contrato?", "update", async () => {
        await updateContractMutation.mutateAsync({ employeeId: id, contractId: selectedContract.id, data })
        setIsContractFormOpen(false)
        setSelectedContract(null)
      })
    } else {
      createContractMutation.mutate({ employeeId: id, data }, {
        onSuccess: () => setIsContractFormOpen(false)
      })
    }
  }

  const handleContractDelete = () => {
    if (selectedContract) {
      openSecureAction("Excluir Contrato", "Esta ação não pode ser desfeita.", "delete", async () => {
        await deleteContractMutation.mutateAsync({ employeeId: id, contractId: selectedContract.id })
        setIsContractFormOpen(false)
        setSelectedContract(null)
      })
    }
  }

  const openContractForm = (contract?: EmployeeContract) => {
    if (contract) {
      setSelectedContract(contract)
    } else {
      setSelectedContract(null)
    }
    setIsContractFormOpen(true)
  }

  // --- Advance Handlers ---
  const handleAdvanceSubmit = (data: AdvanceFormData) => {
    if (selectedAdvance) {
      openSecureAction("Atualizar Adiantamento", "Deseja confirmar a alteração deste adiantamento?", "update", async () => {
        await updateAdvanceMutation.mutateAsync({ employeeId: id, advanceId: selectedAdvance.id, data })
        setIsAdvanceFormOpen(false)
        setSelectedAdvance(null)
      })
    } else {
      createAdvanceMutation.mutate({ employeeId: id, data }, {
        onSuccess: () => setIsAdvanceFormOpen(false)
      })
    }
  }

  const handleAdvanceDelete = () => {
    if (selectedAdvance) {
      openSecureAction("Excluir Adiantamento", "Esta ação também excluirá a transação financeira associada.", "delete", async () => {
        await deleteAdvanceMutation.mutateAsync({ employeeId: id, advanceId: selectedAdvance.id })
        setIsAdvanceFormOpen(false)
        setSelectedAdvance(null)
      })
    }
  }

  const openAdvanceForm = (advance?: EmployeeAdvance & { transaction: FinancialTransaction | null }) => {
    if (advance) {
      setSelectedAdvance(advance)
    } else {
      setSelectedAdvance(null)
    }
    setIsAdvanceFormOpen(true)
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center space-x-4">
        <Link href="/employees">
          <Button variant="outline" size="icon" className="cursor-pointer">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>

        <h2 className="text-2xl font-bold tracking-tight">{employee.name}</h2>
        
        <Badge className="ml-auto" variant={employee.active ? "default" : "destructive"}>
          {employee.active ? "Ativo" : "Inativo"}
        </Badge>
      </div>

      <Tabs defaultValue="dados" className="space-y-4">
        {/* ... Tab triggers remain same ... */}
        <TabsList className="cursor-pointer w-full">
          <TabsTrigger value="dados" className="cursor-pointer">Dados Pessoais</TabsTrigger>
          <TabsTrigger value="vinculos" className="cursor-pointer">Vínculos</TabsTrigger>
          <TabsTrigger value="contratos" className="cursor-pointer">Contratos</TabsTrigger>
          <TabsTrigger value="adiantamentos" className="cursor-pointer">Adiantamentos</TabsTrigger>
          <TabsTrigger value="contas" className="cursor-pointer">Contas</TabsTrigger>
          <TabsTrigger value="etiquetas" className="cursor-pointer">Etiquetas</TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Funcionário</CardTitle>
              <CardDescription>
                Dados pessoais e informações básicas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold">CPF:</span> {employee.document}
                </div>
                <div>
                  <span className="font-semibold">RG:</span> {employee.rg}
                </div>
                <div>
                  <span className="font-semibold">Email:</span> {employee.email}
                </div>
                <div>
                  <span className="font-semibold">Telefone:</span> {employee.phone}
                </div>
                <div>
                  <span className="font-semibold">Cargo Atual:</span> {employee.role}
                </div>
                <div>
                  <span className="font-semibold">Salário Base:</span> {formatCentsToReal(employee.salaryInCents)}
                </div>
              </div>
              
              <div className="mt-4 border-t pt-4">
                <h4 className="mb-2 font-semibold">Tamanhos</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>Camisa: {employee.shirtSize}</div>
                  <div>Calça: {employee.pantsSize}</div>
                  <div>Calçado: {employee.shoeSize}</div>
                </div>
              </div>

              <div className="mt-6">
                <Button onClick={() => setIsEditFormOpen(true)} className="cursor-pointer">
                  Editar Dados
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vinculos" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Vínculos Empregatícios</CardTitle>
                <CardDescription>Histórico de cargos e registros do funcionário.</CardDescription>
              </div>
              <Button onClick={() => openRecordForm()} size="sm" className="cursor-pointer">
                <Plus className="size-4" /> Novo Vínculo
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {records?.length === 0 ? (
                <div className="text-center text-sm py-6 text-muted-foreground">
                  Nenhum vínculo registrado.
                </div>
              ) : (
                records?.map((record) => (
                  <Card 
                    key={record.id} 
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => openRecordForm(record)}
                  >
                    <CardHeader>
                      <div className="flex justify-between">
                        <CardTitle className="text-base">{record.jobTitle}</CardTitle>
                        <Badge variant={!record.terminationDate ? "default" : "secondary"}>{record.contractType}</Badge>
                      </div>
                      <CardDescription>Admissão: {formatDate(record.admissionDate)}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <p>Salário: {formatCentsToReal(record.baseSalaryInCents)}</p>
                      {record.terminationDate && <p>Término: {formatDate(record.terminationDate)}</p>}
                      {record.workRegime && <p>Regime: {record.workRegime}</p>}
                      {record.notes && <p className="mt-2 text-xs text-muted-foreground">{record.notes}</p>}
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contratos" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Contratos</CardTitle>
                <CardDescription>Documentos e contratos de prestação de serviço.</CardDescription>
              </div>
              <Button onClick={() => openContractForm()} size="sm" className="cursor-pointer">
                <Plus className="size-4" /> Novo Contrato
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {contracts?.length === 0 ? (
                <div className="text-sm text-center py-6 text-muted-foreground">
                  Nenhum contrato registrado.
                </div>
              ) : (
                contracts?.map((contract) => (
                  <Card 
                    key={contract.id}
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => openContractForm(contract)}
                  >
                    <CardHeader>
                      <div className="flex justify-between">
                        <CardTitle className="text-base">{contract.type}</CardTitle>
                        <Badge variant={contract.status === "ACTIVE" ? "default" : "secondary"}>
                          {contract.status === "ACTIVE" ? "Ativo" : contract.status}
                        </Badge>
                      </div>
                      <CardDescription>Início: {formatDate(contract.startDate)}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <p>Valor: {formatCentsToReal(contract.valueInCents)}</p>
                      {contract.endDate && <p>Fim: {formatDate(contract.endDate)}</p>}
                      {contract.description && <p className="mt-2 text-xs text-muted-foreground">{contract.description}</p>}
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="adiantamentos" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Adiantamentos</CardTitle>
                <CardDescription>Registro de vales e pagamentos antecipados.</CardDescription>
              </div>
              <Button onClick={() => openAdvanceForm()} size="sm" className="cursor-pointer">
                <Plus className="size-4" /> Novo Adiantamento
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {advances?.length === 0 ? (
                <div className="text-sm text-center py-6 text-muted-foreground">
                  Nenhum adiantamento registrado.
                </div>
              ) : (
                advances?.map((advance) => (
                  <Card 
                    key={advance.id} 
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => openAdvanceForm(advance)}
                  >
                    <CardHeader>
                      <div className="flex justify-between">
                        <CardTitle className="text-base">{advance.payrollReference ? `Ref: ${advance.payrollReference}` : "Adiantamento"}</CardTitle>
                        <Badge variant="outline">Saída de Caixa</Badge>
                      </div>
                      <CardDescription>Data: {formatDate(advance.date)}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <p className="text-lg font-bold text-red-600">-{formatCentsToReal(advance.amountInCents)}</p>
                      {advance.note && <p className="mt-2 text-xs text-muted-foreground">{advance.note}</p>}
                      {advance.transaction && (
                        <div className="mt-2 text-[10px] text-muted-foreground uppercase tracking-wider">
                            Transação: {advance.transaction.paymentMethod}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contas" className="space-y-4">
          <EmployeeAccountTab employeeId={id} />
        </TabsContent>


        <TabsContent value="etiquetas">
          <EmployeeTagsTab employeeId={id} />
        </TabsContent>
      </Tabs>

      <EmployeeForm
        open={isEditFormOpen}
        onOpenChange={setIsEditFormOpen}
        onSubmit={handleUpdateEmployee}
        initialData={employee}
        isLoading={updateMutation.isPending}
      />

      <EmploymentRecordForm
        open={isRecordFormOpen}
        onOpenChange={setIsRecordFormOpen}
        onSubmit={handleRecordSubmit}
        onDelete={handleRecordDelete}
        initialData={selectedRecord ? {
          admissionDate: new Date(selectedRecord.admissionDate).toISOString().split("T")[0],
          terminationDate: selectedRecord.terminationDate ? new Date(selectedRecord.terminationDate).toISOString().split("T")[0] : undefined,
          jobTitle: selectedRecord.jobTitle,
          baseSalary: selectedRecord.baseSalaryInCents,
          contractType: selectedRecord.contractType,
          weeklyWorkload: selectedRecord.weeklyWorkload || 0,
          workRegime: selectedRecord.workRegime || "",
          hasMedicalExam: selectedRecord.hasMedicalExam,
          hasSignedRegistration: selectedRecord.hasSignedRegistration,
          hasSignedEpiReceipt: selectedRecord.hasSignedEpiReceipt,
          hasSignedServiceOrder: selectedRecord.hasSignedServiceOrder,
          hasSignedExperienceContract: selectedRecord.hasSignedExperienceContract,
          hasNr316Certificate: selectedRecord.hasNr316Certificate,
          hasNr317Certificate: selectedRecord.hasNr317Certificate,
          notes: selectedRecord.notes || "",
        } : undefined}
        isLoading={createRecordMutation.isPending || updateRecordMutation.isPending || deleteRecordMutation.isPending}
      />

      <ContractForm
        open={isContractFormOpen}
        onOpenChange={setIsContractFormOpen}
        onSubmit={handleContractSubmit}
        onDelete={handleContractDelete}
        initialData={selectedContract ? {
          type: selectedContract.type,
          startDate: new Date(selectedContract.startDate).toISOString().split("T")[0],
          endDate: selectedContract.endDate ? new Date(selectedContract.endDate).toISOString().split("T")[0] : undefined,
          valueInCents: selectedContract.valueInCents,
          status: selectedContract.status,
          description: selectedContract.description || "",
          fileUrl: selectedContract.fileUrl || "",
        } : undefined}
        isLoading={createContractMutation.isPending || updateContractMutation.isPending || deleteContractMutation.isPending}
      />

      <AdvanceForm
        open={isAdvanceFormOpen}
        onOpenChange={setIsAdvanceFormOpen}
        onSubmit={handleAdvanceSubmit}
        onDelete={handleAdvanceDelete}
        initialData={selectedAdvance ? {
          valueInCents: selectedAdvance.amountInCents,
          date: new Date(selectedAdvance.date).toISOString().split("T")[0],
          note: selectedAdvance.note || "",
          payrollReference: selectedAdvance.payrollReference || "",
          paymentMethod: selectedAdvance.transaction?.paymentMethod ? (selectedAdvance.transaction.paymentMethod as AdvanceFormData["paymentMethod"]) : "TRANSFERENCIA",
        } : undefined}
        isLoading={createAdvanceMutation.isPending || updateAdvanceMutation.isPending || deleteAdvanceMutation.isPending}
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
