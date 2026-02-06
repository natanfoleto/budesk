"use client"

import { Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { User } from "@/types/user"

import { UserFormDialog } from "./_components/user-form-dialog"
import { UsersTable } from "./_components/users-table"

export default function UsersPage() {
  const [data, setData] = useState<User[]>([])

  const [open, setOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      const response = await fetch("/api/users")
      if (!response.ok) throw new Error("Failed to fetch users")
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error(error)
      toast.error("Erro ao carregar usuários")
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      const response = await fetch(`/api/users/${deleteId}`, {
        method: "DELETE",
        headers: {
          "x-user-id": "CURRENT_USER_ID", 
        }
      })
      
      if (!response.ok) throw new Error("Falha ao excluir")
      
      toast.success("Usuário excluído com sucesso")
      fetchData()
    } catch (error) {
      console.error(error)
      toast.error("Erro ao excluir usuário")
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Usuários</h2>
          <p className="text-muted-foreground">
            Gerencie os usuários do sistema e suas permissões.
          </p>
        </div>
        <Button onClick={() => { setEditingUser(undefined); setOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" /> Novo Usuário
        </Button>
      </div>
      
      <UsersTable 
        users={data}
        onEdit={handleEdit}
        onDelete={(user) => setDeleteId(user.id)}
      />

      <UserFormDialog 
        open={open} 
        onOpenChange={setOpen} 
        user={editingUser}
        onSuccess={fetchData}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o usuário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
