"use client"

import { Loader2,Plus } from "lucide-react"
import { useState } from "react"

import { JobForm } from "@/components/rh/job-form"
import { JobsTable } from "@/components/rh/jobs-table"
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
import { useCreateJob, useDeleteJob, useJobs, useUpdateJob } from "@/hooks/use-jobs"
import { Job, JobFormData } from "@/lib/services/jobs"

export default function JobsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: jobs, isLoading } = useJobs()
  const createMutation = useCreateJob()
  const updateMutation = useUpdateJob()
  const deleteMutation = useDeleteJob()

  const handleCreateOrUpdate = (data: JobFormData) => {
    if (editingJob) {
      updateMutation.mutate(
        { id: editingJob.id, data },
        {
          onSuccess: () => {
            setIsFormOpen(false)
            setEditingJob(null)
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

  const handleEditClick = (job: Job) => {
    setEditingJob(job)
    setIsFormOpen(true)
  }

  const handleDeleteClick = (id: string) => {
    setDeleteId(id)
  }

  const handleConfirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => {
          setDeleteId(null)
        },
      })
    }
  }

  const openCreate = () => {
    setEditingJob(null)
    setIsFormOpen(true)
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Cargos</h2>
          <p className="text-muted-foreground">
            Gerencie os cargos da empresa.
          </p>
        </div>
        <Button onClick={openCreate} className="cursor-pointer">
          <Plus className="h-4 w-4" /> Novo Cargo
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-full w-full py-10">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <JobsTable
          jobs={jobs || []}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />
      )}

      <JobForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleCreateOrUpdate}
        initialData={editingJob}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Se houver funcionários vinculados a este cargo, ele será apenas desativado. Caso contrário, será excluído permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
            >
              {deleteMutation.isPending ? "Excluindo..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
