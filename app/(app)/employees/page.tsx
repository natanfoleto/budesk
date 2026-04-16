'use client'

import { FilterX, HelpCircle,Loader2, Plus, Search } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo,useState } from 'react'

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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useDebounce } from '@/hooks/use-debounce'
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
  const docFiltersUrl = searchParams.get('docFilters') || ''
  const page = Number(searchParams.get('page')) || 1

  const hasActiveFilters = 
    name !== '' || 
    jobId !== '' || 
    tagId !== '' || 
    cpf !== '' || 
    status !== 'all' ||
    docFiltersUrl !== ''

  const [searchTerm, setSearchTerm] = useState(name)
  const [cpfTerm, setCpfTerm] = useState(cpf)

  const debouncedSearchTerm = useDebounce(searchTerm, 250)
  const debouncedCpfTerm = useDebounce(cpfTerm, 250)

  // Sync searchTerm when name from URL changes
  useEffect(() => {
    if (name !== searchTerm) {
      setSearchTerm(name)
    }
  }, [name])

  // Sync cpfTerm when cpf from URL changes
  useEffect(() => {
    if (cpf !== cpfTerm) {
      setCpfTerm(cpf)
    }
  }, [cpf])

  // Update URL only when debounced terms change and they differ from current URL
  useEffect(() => {
    const currentName = searchParams.get('name') || ''
    const currentCpf = searchParams.get('cpf') || ''

    const newFilters: Record<string, string | number | undefined> = {}
    let hasChanges = false
    
    if (debouncedSearchTerm !== currentName) {
      newFilters.name = debouncedSearchTerm
      hasChanges = true
    }
    if (debouncedCpfTerm !== currentCpf) {
      newFilters.cpf = debouncedCpfTerm
      hasChanges = true
    }
    
    if (hasChanges) {
      updateFilters(newFilters)
    }
  }, [debouncedSearchTerm, debouncedCpfTerm]) // Depend only on debounced values

  const { data: jobs } = useJobs()
  const { data: tags } = useEmployeeTags()
  const limit = Number(searchParams.get('limit')) || 10

  const { data: response, isLoading } = useEmployees({
    name,
    jobId: jobId === '' ? undefined : jobId,
    tagIds: tagId ? [tagId] : undefined,
    cpf,
    status: status === 'all' ? undefined : status,
    docFilters: docFiltersUrl === '' ? undefined : docFiltersUrl,
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
    setSearchTerm('')
    setCpfTerm('')
  }

  const DOCUMENT_FILTERS = [
    { id: 'hasMedicalExam', label: 'Exame Médico' },
    { id: 'hasSignedRegistration', label: 'Ficha de Registro' },
    { id: 'hasSignedEpiReceipt', label: 'Ficha de EPI' },
    { id: 'hasSignedServiceOrder', label: 'Ordem de Serviço' },
    { id: 'hasSignedExperienceContract', label: 'Contrato Experiência' },
    { id: 'hasNr316Certificate', label: 'Certif. NR31.6' },
    { id: 'hasNr317Certificate', label: 'Certif. NR31.7' },
  ]

  const docFiltersObj = useMemo(() => {
    const obj: Record<string, boolean> = {}
    if (docFiltersUrl) {
      docFiltersUrl.split(',').forEach(f => {
        const [k, v] = f.split(':')
        if (k && (v === 'true' || v === 'false')) obj[k] = v === 'true'
      })
    }
    return obj
  }, [docFiltersUrl])

  const toggleDocFilter = (id: string, value: boolean) => {
    const newFilters = { ...docFiltersObj }
    if (newFilters[id] === value) {
      delete newFilters[id]
    } else {
      newFilters[id] = value
    }
    const items = Object.entries(newFilters).map(([k, v]) => `${k}:${v}`)
    updateFilters({ docFilters: items.length > 0 ? items.join(',') : '' })
  }

  const totalDocFiltersActive = Object.keys(docFiltersObj).length

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
      <Card className="relative overflow-visible">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2 lg:col-span-2">
              <Label>Nome</Label>
              <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
                <Input
                  placeholder="Buscar por nome"
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                value={cpfTerm}
                maxLength={14}
                onChange={(e) => setCpfTerm(maskCPF(e.target.value))}
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

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Documentação
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-[250px]">
                        Filtra apenas funcionários com vínculo ativo. Você pode combinar filtros de ter (Com) ou não ter (Sem) a documentação.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-normal cursor-pointer">
                    {totalDocFiltersActive > 0 ? `${totalDocFiltersActive} filtros ativos` : "Não filtrar"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="h-80 w-64 overflow-y-auto" align="end">
                  <DropdownMenuLabel>Filtrar por Documento</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {DOCUMENT_FILTERS.map((doc) => (
                    <div key={doc.id} className="py-1">
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{doc.label}</div>
                      <DropdownMenuCheckboxItem
                        checked={docFiltersObj[doc.id] === true}
                        onCheckedChange={() => toggleDocFilter(doc.id, true)}
                      >
                        Com (Regular)
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={docFiltersObj[doc.id] === false}
                        onCheckedChange={() => toggleDocFilter(doc.id, false)}
                      >
                        Sem (Pendente)
                      </DropdownMenuCheckboxItem>
                    </div>
                  ))}
                  {totalDocFiltersActive > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem
                        className="text-destructive focus:text-destructive font-medium justify-center"
                        onSelect={() => updateFilters({ docFilters: '' })}
                      >
                        Limpar Filtros
                      </DropdownMenuCheckboxItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>

        {hasActiveFilters && (
          <div className="absolute -top-4 left-1/2 z-10 -translate-x-1/2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={clearFilters}
                    className="h-8 w-8 rounded-full border bg-background shadow-xs hover:bg-accent"
                  >
                    <FilterX className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Limpar filtros</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
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
