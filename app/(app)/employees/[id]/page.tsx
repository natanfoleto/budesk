"use client"

import { ArrowLeft, Plus } from "lucide-react"
import Link from "next/link"
import { use, useState } from "react"

import { AdvanceForm } from "@/components/employees/advance-form"
import { ContractForm } from "@/components/employees/contract-form"
import { EmployeeForm } from "@/components/employees/employee-form"
import { EmploymentRecordForm } from "@/components/employees/employment-record-form"
import { TimeTrackingView } from "@/components/employees/time-tracking-view"
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
  useEmployee,
  useEmployeeAdvances,
  useEmployeeContracts,
  useEmploymentRecords,
  useUpdateEmployee,
} from "@/hooks/use-employees"
import { 
  AdvanceFormData,
  ContractFormData, 
  EmployeeFormData, 
  EmploymentRecordFormData, 
} from "@/types/employee"
import { 
  EmployeeAdvance,
  EmployeeContract,
  EmploymentRecord,
  FinancialTransaction
} from "@prisma/client"
import { formatCurrency, formatDate } from "@/lib/utils"

export default function EmployeeProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: employee, isLoading } = useEmployee(id)
  const updateMutation = useUpdateEmployee()
  
  // Records
  const { data: records } = useEmploymentRecords(id)
  const createRecordMutation = useCreateEmploymentRecord()
  const [isRecordFormOpen, setIsRecordFormOpen] = useState(false)

  // Contracts
  const { data: contracts } = useEmployeeContracts(id)
  const createContractMutation = useCreateEmployeeContract()
  const [isContractFormOpen, setIsContractFormOpen] = useState(false)

  // Advances
  const { data: advances } = useEmployeeAdvances(id)
  const createAdvanceMutation = useCreateEmployeeAdvance()
  const [isAdvanceFormOpen, setIsAdvanceFormOpen] = useState(false)

  // Edit Employee
  const [isEditFormOpen, setIsEditFormOpen] = useState(false)

  if (isLoading) return <div className="p-8">Carregando...</div>
  if (!employee) return <div className="p-8">Funcionário não encontrado</div>

  const handleUpdateEmployee = (data: Partial<EmployeeFormData>) => {
    updateMutation.mutate({ id, data }, {
      onSuccess: () => setIsEditFormOpen(false)
    })
  }

  const handleCreateRecord = (data: EmploymentRecordFormData) => {
    createRecordMutation.mutate({ employeeId: id, data }, {
      onSuccess: () => setIsRecordFormOpen(false)
    })
  }

  const handleCreateContract = (data: ContractFormData) => {
    createContractMutation.mutate({ employeeId: id, data }, {
      onSuccess: () => setIsContractFormOpen(false)
    })
  }

  const handleCreateAdvance = (data: AdvanceFormData) => {
    createAdvanceMutation.mutate({ employeeId: id, data }, {
      onSuccess: () => setIsAdvanceFormOpen(false)
    })
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center space-x-4">
        <Link href="/employees">
          <Button variant="outline" size="icon" className="cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">{employee.name}</h2>
        <Badge variant={employee.active ? "default" : "destructive"}>
          {employee.active ? "Ativo" : "Inativo"}
        </Badge>
      </div>

      <Tabs defaultValue="dados" className="space-y-4">
        <TabsList className="cursor-pointer">
          <TabsTrigger value="dados" className="cursor-pointer">Dados Pessoais</TabsTrigger>
          <TabsTrigger value="vinculos" className="cursor-pointer">Vínculos</TabsTrigger>
          <TabsTrigger value="contratos" className="cursor-pointer">Contratos</TabsTrigger>
          <TabsTrigger value="adiantamentos" className="cursor-pointer">Adiantamentos</TabsTrigger>
          <TabsTrigger value="ponto" className="cursor-pointer">Ponto</TabsTrigger>
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
                  <span className="font-semibold">CPF:</span> {employee.document || "-"}
                </div>
                <div>
                  <span className="font-semibold">RG:</span> {employee.rg || "-"}
                </div>
                <div>
                  <span className="font-semibold">Email:</span> {employee.email || "-"}
                </div>
                <div>
                  <span className="font-semibold">Telefone:</span> {employee.phone || "-"}
                </div>
                <div>
                  <span className="font-semibold">Cargo Atual:</span> {employee.role}
                </div>
                <div>
                  <span className="font-semibold">Salário Base:</span> {formatCurrency(Number(employee.salary))}
                </div>
              </div>
              
              <div className="mt-4 border-t pt-4">
                <h4 className="mb-2 font-semibold">Tamanhos</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>Camisa: {employee.shirtSize || "-"}</div>
                  <div>Calça: {employee.pantsSize || "-"}</div>
                  <div>Calçado: {employee.shoeSize || "-"}</div>
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
          <div className="flex justify-end">
            <Button onClick={() => setIsRecordFormOpen(true)} className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4" /> Novo Vínculo
            </Button>
          </div>
          {records?.map((record: EmploymentRecord) => (
            <Card key={record.id}>
              <CardHeader>
                <div className="flex justify-between">
                  <CardTitle>{record.jobTitle}</CardTitle>
                  <Badge variant={record.isActive ? "default" : "secondary"}>{record.contractType}</Badge>
                </div>
                <CardDescription>Admissão: {formatDate(record.admissionDate)}</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Salário: {formatCurrency(Number(record.baseSalary))}</p>
                {record.terminationDate && <p>Término: {formatDate(record.terminationDate)}</p>}
                {record.workRegime && <p>Regime: {record.workRegime}</p>}
                {record.notes && <p className="mt-2 text-sm text-muted-foreground italic">{record.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="contratos" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsContractFormOpen(true)} className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4" /> Novo Contrato
            </Button>
          </div>
          {contracts?.map((contract: EmployeeContract) => (
            <Card key={contract.id}>
              <CardHeader>
                <div className="flex justify-between">
                  <CardTitle>{contract.type}</CardTitle>
                  <Badge variant={contract.status === "ACTIVE" ? "default" : "secondary"}>{contract.status}</Badge>
                </div>
                <CardDescription>Início: {formatDate(contract.startDate)}</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Valor: {formatCurrency(contract.value as unknown as number)}</p>
                {contract.endDate && <p>Fim: {formatDate(contract.endDate)}</p>}
                {contract.description && <p className="mt-2 text-sm text-muted-foreground">{contract.description}</p>}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="adiantamentos" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsAdvanceFormOpen(true)} className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4" /> Novo Adiantamento
            </Button>
          </div>
          {advances?.map((advance: EmployeeAdvance & { transaction?: FinancialTransaction }) => (
            <Card key={advance.id}>
              <CardHeader>
                <div className="flex justify-between">
                  <CardTitle>{advance.payrollReference ? `Ref: ${advance.payrollReference}` : "Adiantamento"}</CardTitle>
                  <Badge variant="outline">Saída de Caixa</Badge>
                </div>
                <CardDescription>Data: {formatDate(advance.date)}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-red-600">-{formatCurrency(advance.amount as unknown as number)}</p>
                {advance.note && <p className="mt-2 text-sm text-muted-foreground">{advance.note}</p>}
                {advance.transaction && (
                  <div className="mt-2 text-xs text-muted-foreground">
                      Transação Financeira: {advance.transaction.paymentMethod}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="ponto">
          <TimeTrackingView employeeId={id} />
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
        onSubmit={handleCreateRecord}
        isLoading={createRecordMutation.isPending}
      />

      <ContractForm
        open={isContractFormOpen}
        onOpenChange={setIsContractFormOpen}
        onSubmit={handleCreateContract}
        isLoading={createContractMutation.isPending}
      />

      <AdvanceForm
        open={isAdvanceFormOpen}
        onOpenChange={setIsAdvanceFormOpen}
        onSubmit={handleCreateAdvance}
        isLoading={createAdvanceMutation.isPending}
      />
    </div>
  )
}
