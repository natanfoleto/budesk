"use client"

import { EmployeeAccount, EmployeeAccountType } from "@prisma/client"
import { Landmark, Plus, QrCode,Star } from "lucide-react"
import { useState } from "react"

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
  useCreateEmployeeAccount, 
  useDeleteEmployeeAccount, 
  useEmployeeAccounts, 
  useUpdateEmployeeAccount} from "@/hooks/use-employees"
import { EmployeeAccountFormData } from "@/types/employee"

import { EmployeeAccountForm } from "./employee-account-form"
import { SecureActionDialog } from "./secure-action-dialog"

interface EmployeeAccountTabProps {
  employeeId: string
}

export function EmployeeAccountTab({ employeeId }: EmployeeAccountTabProps) {
  const { data: accounts, isLoading } = useEmployeeAccounts(employeeId)
  const createMutation = useCreateEmployeeAccount()
  const updateMutation = useUpdateEmployeeAccount()
  const deleteMutation = useDeleteEmployeeAccount()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<EmployeeAccount | null>(null)
  
  const [secureDialog, setSecureDialog] = useState<{
    isOpen: boolean
    title: string
    description: string
    action: () => Promise<void>
      }>({
        isOpen: false,
        title: "",
        description: "",
        action: async () => {},
      })

  const handleAccountSubmit = (data: EmployeeAccountFormData) => {
    if (selectedAccount) {
      updateMutation.mutate({ 
        employeeId, 
        accountId: selectedAccount.id, 
        data 
      }, {
        onSuccess: () => {
          setIsFormOpen(false)
          setSelectedAccount(null)
        }
      })
    } else {
      createMutation.mutate({ employeeId, data }, {
        onSuccess: () => setIsFormOpen(false)
      })
    }
  }

  const handleDelete = () => {
    if (!selectedAccount) return

    setSecureDialog({
      isOpen: true,
      title: "Excluir Conta",
      description: "Deseja realmente excluir esta conta bancária/PIX? Esta ação não pode ser desfeita.",
      action: async () => {
        await deleteMutation.mutateAsync({ employeeId, accountId: selectedAccount.id })
        setIsFormOpen(false)
        setSelectedAccount(null)
      }
    })
  }

  const getAccountIcon = (type: EmployeeAccountType) => {
    if (type === EmployeeAccountType.BANCARIA) return <Landmark className="size-4" />
    return <QrCode className="size-4" />
  }

  const getAccountTypeLabel = (type: EmployeeAccountType) => {
    switch (type) {
    case EmployeeAccountType.BANCARIA: return "Bancária"
    case EmployeeAccountType.PIX_CPF: return "PIX (CPF)"
    case EmployeeAccountType.PIX_TELEFONE: return "PIX (Telefone)"
    case EmployeeAccountType.PIX_EMAIL: return "PIX (Email)"
    case EmployeeAccountType.PIX_CHAVE_ALEATORIA: return "PIX (Chave)"
    default: return type
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Contas</CardTitle>
            <CardDescription>Gerencie as contas para pagamento do funcionário.</CardDescription>
          </div>
          <Button onClick={() => {
            setSelectedAccount(null)
            setIsFormOpen(true)
          }} size="sm" className="cursor-pointer">
            <Plus className="size-4" /> Nova Conta
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="text-center py-6">Carregando contas...</div>
          ) : accounts?.length === 0 ? (
            <div className="text-center text-sm py-6 text-muted-foreground">
              Nenhuma conta registrada.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accounts?.map((account: EmployeeAccount) => (
                <Card 
                  key={account.id} 
                  className="cursor-pointer hover:bg-accent/50 transition-colors border-2 relative"
                  style={{ borderColor: account.isDefault ? "var(--primary)" : "transparent" }}
                  onClick={() => {
                    setSelectedAccount(account)
                    setIsFormOpen(true)
                  }}
                >
                  {account.isDefault && (
                    <div className="absolute top-2 right-2 text-primary">
                      <Star className="size-4 fill-current" />
                    </div>
                  )}
                  <CardHeader className="px-4">
                    <div className="flex items-center space-x-2">
                      {getAccountIcon(account.type)}
                      <CardTitle className="text-base">{getAccountTypeLabel(account.type)}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-sm">
                    <p className="font-mono font-bold break-all">{account.identifier}</p>
                    {account.description && <p className="text-xs text-muted-foreground mt-1">{account.description}</p>}
                    <div className="mt-2 flex gap-2">
                      {account.isDefault && <Badge variant="default" className="text-[10px] h-4">Padrão</Badge>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <EmployeeAccountForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleAccountSubmit}
        onDelete={handleDelete}
        initialData={selectedAccount ? {
          ...selectedAccount,
          description: selectedAccount.description || undefined
        } : undefined}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <SecureActionDialog
        open={secureDialog.isOpen}
        onOpenChange={(open) => setSecureDialog({ ...secureDialog, isOpen: open })}
        onConfirm={secureDialog.action}
        title={secureDialog.title}
        description={secureDialog.description}
        actionType="delete"
      />
    </div>
  )
}
