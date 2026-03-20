'use client'

import { FilterX, Loader2, Plus, Search } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

import { EmployeeForm } from '@/components/employees/employee-form'
import { EmployeesTable } from '@/components/employees/employees-table'
import { TagManagementModal } from '@/components/employees/TagManagementModal'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useEmployeeTags } from '@/hooks/use-employee-tags'
import {
  useCreateEmployee,
  useDeleteEmployee,
  useEmployees,
} from '@/hooks/use-employees'
import { useJobs } from '@/hooks/use-jobs'
import { Job } from '@/lib/services/jobs'
import { maskCPF } from '@/lib/utils'
import { EmployeeFormData } from '@/types/employee'

function EmployeesContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [formKey, setFormKey] = useState(0)

  // Tag Modal State
  const [tagModalOpen, setTagModalOpen] = useState(false)
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)

  // Filter and Pagination state from URL
  const name = searchParams.get('name') || ''
  const jobId = searchParams.get('jobId') || ''
  const tagId = searchParams.get('tagId') || ''
  const cpf = searchParams.get('cpf') || ''
  const status = searchParams.get('status') || 'all'
  const page = Number(searchParams.get('page')) || 1

  const { data: jobs } = useJobs()
  const { data: tags } = useEmployeeTags()
  const limit = Number(searchParams.get('limit')) || 10

  const { data: response, isLoading } = useEmployees({
    name,
    jobId: jobId === '' ? undefined : jobId,
    tagIds: tagId ? [tagId] : undefined,
    cpf,
    status: status === 'all' ? undefined : status,
    page,
    limit,
  })

  const createMutation = useCreateEmployee()
  const deleteMutation = useDeleteEmployee()

  const updateFilters = (
    newFilters: Record<string, string | number | undefined>
  ) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined || value === '' || value === 'all') {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    })
    // Reset to page 1 when changing filters, unless the update is for the page itself
    if (!newFilters.page) {
      params.delete('page')
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const handleCreate = (data: EmployeeFormData) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setIsFormOpen(false)
        setFormKey((prev) => prev + 1)
      },
    })
  }

  const handleDeleteClick = (id: string) => {
    setDeleteId(id)
  }

  const handleConfirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId)
      setDeleteId(null)
    }
  }

  const handleEditTag = (id: string | null) => {
    setSelectedTagId(id)
    setTagModalOpen(true)
  }

  const clearFilters = () => {
    router.replace(pathname, { scroll: false })
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Funcionários</h2>
          <p className="text-muted-foreground">
            Gerencie o cadastro de funcionários, cargos e documentos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TagManagementModal 
            open={tagModalOpen} 
            onOpenChange={setTagModalOpen}
            defaultTagId={selectedTagId}
            trigger={
              <Button variant="outline" className="cursor-pointer gap-2" onClick={() => handleEditTag(null)}>
                Gerenciar Etiquetas
              </Button>
            }
          />
          <Button onClick={() => setIsFormOpen(true)} className="cursor-pointer">
            <Plus className="h-4 w-4" /> Novo Funcionário
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2 lg:col-span-2">
              <Label>Nome</Label>
              <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
                <Input
                  placeholder="Buscar por nome"
                  className="pl-8"
                  value={name}
                  onChange={(e) => updateFilters({ name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cargo</Label>
              <Select
                value={jobId || 'all'}
                onValueChange={(v) => updateFilters({ jobId: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos os cargos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os cargos</SelectItem>
                  {jobs?.map((job: Job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>CPF</Label>
              <Input
                placeholder="000.000.000-00"
                value={cpf}
                maxLength={14}
                onChange={(e) => updateFilters({ cpf: maskCPF(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label>Etiqueta</Label>
              <Select
                value={tagId || 'all'}
                onValueChange={(v) => updateFilters({ tagId: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas as etiquetas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as etiquetas</SelectItem>
                  {tags?.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="size-2 rounded-full" 
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => updateFilters({ status: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ATIVO">Ativo</SelectItem>
                  <SelectItem value="ENCERRADO">Encerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              onClick={clearFilters}
              className="text-muted-foreground w-full"
            >
              <FilterX className="h-4 w-4" /> Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex h-full w-full items-center justify-center py-10">
          <Loader2 className="text-muted-foreground size-4 animate-spin" />
        </div>
      ) : (
        <EmployeesTable
          employees={response?.data || []}
          meta={response?.meta}
          onPageChange={(p) => updateFilters({ page: p })}
          onLimitChange={(l) => updateFilters({ limit: l, page: 1 })}
          onDelete={handleDeleteClick}
          onEditTag={handleEditTag}
        />
      )}

      <EmployeeForm
        key={formKey}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleCreate}
        isLoading={createMutation.isPending}
      />

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso excluirá permanentemente o
              funcionário e removerá seus dados dos nossos servidores.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function EmployeesPage() {
  return (
    <Suspense>
      <EmployeesContent />
    </Suspense>
  )
}
