import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { 
  createJob, 
  deleteJob, 
  getJobs, 
  JobFormData, 
  updateJob} from "@/lib/services/jobs"

export const useJobs = () => {
  return useQuery({
    queryKey: ["jobs"],
    queryFn: getJobs,
  })
}

export const useCreateJob = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] })
      toast.success("Cargo criado com sucesso!")
    },
    onError: () => toast.error("Erro ao criar cargo"),
  })
}

export const useUpdateJob = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<JobFormData> }) => updateJob(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] })
      toast.success("Cargo atualizado!")
    },
    onError: () => toast.error("Erro ao atualizar cargo"),
  })
}

export const useDeleteJob = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] })
      toast.success("Cargo excluído!")
    },
    onError: () => toast.error("Erro ao excluir cargo"),
  })
}
