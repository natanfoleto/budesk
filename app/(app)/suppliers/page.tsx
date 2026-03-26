'use client'

import { Loader2, Plus } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

import { SupplierFilters } from '@/components/suppliers/supplier-filters'
import { SupplierForm } from '@/components/suppliers/supplier-form'
import { SuppliersTable } from '@/components/suppliers/suppliers-table'
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
import { useDebounce } from '@/hooks/use-debounce'
import {
  useCreateSupplier,
  useDeleteSupplier,
  useSuppliers,
  useUpdateSupplier,
} from '@/hooks/use-suppliers'
import { SupplierFormData, SupplierWithDetails } from '@/types/supplier'

function SuppliersContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierWithDetails | undefined>(undefined)
  const [supplierToDelete, setSupplierToDelete] = useState<SupplierWithDetails | undefined>(undefined)

  // Filter and Pagination state from URL
  const name = searchParams.get('name') || ''
  const document = searchParams.get('document') || ''
  const city = searchParams.get('city') || ''
  const status = searchParams.get('status') || 'all'
  const page = Number(searchParams.get('page')) || 1
  const limit = Number(searchParams.get('limit')) || 10

  const [searchTerm, setSearchTerm] = useState(name)
  const [documentTerm, setDocumentTerm] = useState(document)
  const [cityTerm, setCityTerm] = useState(city)

  const debouncedSearchTerm = useDebounce(searchTerm, 400)
  const debouncedDocumentTerm = useDebounce(documentTerm, 400)
  const debouncedCityTerm = useDebounce(cityTerm, 400)

  useEffect(() => {
    const newFilters: Record<string, string | number | undefined> = {}
    let hasChanges = false

    if (debouncedSearchTerm !== name) {
      newFilters.name = debouncedSearchTerm
      hasChanges = true
    }
    if (debouncedDocumentTerm !== document) {
      newFilters.document = debouncedDocumentTerm
      hasChanges = true
    }
    if (debouncedCityTerm !== city) {
      newFilters.city = debouncedCityTerm
      hasChanges = true
    }

    if (hasChanges) {
      newFilters.page = 1
      updateFilters(newFilters)
    }
  }, [debouncedSearchTerm, debouncedDocumentTerm, debouncedCityTerm, name, document, city])

  const { data: response, isLoading } = useSuppliers({
    name,
    document,
    city,
    active: status === 'all' ? undefined : status,
    page,
    limit,
  })

  const createMutation = useCreateSupplier()
  const updateMutation = useUpdateSupplier()
  const deleteMutation = useDeleteSupplier()

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
    if (!newFilters.page && newFilters.page !== page) {
      params.delete('page')
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const handleCreateOrUpdate = (data: SupplierFormData) => {
    if (selectedSupplier) {
      updateMutation.mutate(
        { id: selectedSupplier.id, data },
        {
          onSuccess: () => {
            setIsFormOpen(false)
            setSelectedSupplier(undefined)
          },
        }
      )
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          setIsFormOpen(false)
        },
      })
    }
  }

  const handleEdit = (supplier: SupplierWithDetails) => {
    setSelectedSupplier(supplier)
    setIsFormOpen(true)
  }

  const handleDelete = (supplier: SupplierWithDetails) => {
    setSupplierToDelete(supplier)
  }

  const confirmDelete = () => {
    if (supplierToDelete) {
      deleteMutation.mutate(supplierToDelete.id, {
        onSuccess: () => {
          setSupplierToDelete(undefined)
        }
      })
    }
  }

  const clearFilters = () => {
    router.replace(pathname, { scroll: false })
    setSearchTerm('')
    setDocumentTerm('')
    setCityTerm('')
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fornecedores</h2>
          <p className="text-muted-foreground">
            Gerencie o cadastro de fornecedores para financeiro e insumos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => {
            setSelectedSupplier(undefined)
            setIsFormOpen(true)
          }} className="cursor-pointer">
            <Plus className="h-4 w-4" /> Novo Fornecedor
          </Button>
        </div>
      </div>

      <SupplierFilters
        filters={{ name: searchTerm, document: documentTerm, city: cityTerm, status }}
        onFilterChange={(key, value) => {
          if (key === 'name') setSearchTerm(value)
          else if (key === 'document') setDocumentTerm(value)
          else if (key === 'city') setCityTerm(value)
          else updateFilters({ [key]: value, page: 1 })
        }}
        onClearFilters={clearFilters}
      />

      {isLoading ? (
        <div className="flex h-full w-full items-center justify-center py-10">
          <Loader2 className="text-muted-foreground size-8 animate-spin" />
        </div>
      ) : (
        <SuppliersTable
          suppliers={response?.data || []}
          meta={response?.meta}
          onPageChange={(p) => updateFilters({ page: p })}
          onLimitChange={(l) => updateFilters({ limit: l, page: 1 })}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <SupplierForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open)
          if (!open) setSelectedSupplier(undefined)
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={selectedSupplier}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={!!supplierToDelete} onOpenChange={(open) => !open && setSupplierToDelete(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja excluir?</AlertDialogTitle>
            <AlertDialogDescription>
              O fornecedor <strong>{supplierToDelete?.name}</strong> será permanentemente excluído.
              <br /><br />
              <strong>Observação:</strong> Caso existam vínculos financeiros ou de manutenção associados a este fornecedor, 
              ele será apenas <strong>inativado</strong> para preservar o histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sim, Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function SuppliersPage() {
  return (
    <Suspense>
      <SuppliersContent />
    </Suspense>
  )
}
