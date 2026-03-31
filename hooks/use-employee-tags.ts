import { EmployeeTag } from "@prisma/client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { apiRequest } from "@/lib/api-client"

export const useEmployeeTags = () => {
  return useQuery<EmployeeTag[]>({
    queryKey: ["employee-tags"],
    queryFn: () => apiRequest<EmployeeTag[]>("/api/employee-tags")
  })
}

export const useCreateEmployeeTag = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; color: string }) => {
      return apiRequest<EmployeeTag>("/api/employee-tags", {
        method: "POST",
        body: JSON.stringify(data),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-tags"] })
      toast.success("Etiqueta criada com sucesso")
    },
    onError: (error: Error) => toast.error(error.message)
  })
}

export const useUpdateEmployeeTag = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; color?: string; employeeIds?: string[] }) => {
      return apiRequest<EmployeeTag>(`/api/employee-tags/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-tags"] })
      queryClient.invalidateQueries({ queryKey: ["employee-tags-list"] }) // For employee list filtering
      toast.success("Etiqueta atualizada com sucesso")
    },
    onError: (error: Error) => toast.error(error.message)
  })
}

export const useDeleteEmployeeTag = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => {
      return apiRequest<void>(`/api/employee-tags/${id}`, {
        method: "DELETE",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-tags"] })
      toast.success("Etiqueta excluída com sucesso")
    },
    onError: (error: Error) => toast.error(error.message)
  })
}

export const useEmployeeTagAssignment = (employeeId: string) => {
  const queryClient = useQueryClient()
  
  const query = useQuery<EmployeeTag[]>({
    queryKey: ["employee-tags", employeeId],
    queryFn: () => apiRequest<EmployeeTag[]>(`/api/employees/${employeeId}/tags`),
    enabled: !!employeeId
  })

  const mutation = useMutation({
    mutationFn: (tagIds: string[]) => {
      return apiRequest<EmployeeTag[]>(`/api/employees/${employeeId}/tags`, {
        method: "PUT",
        body: JSON.stringify({ tagIds }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-tags", employeeId] })
      queryClient.invalidateQueries({ queryKey: ["employees"] }) // Refresh general lists
      toast.success("Etiquetas atualizadas")
    },
    onError: (error: Error) => toast.error(error.message)
  })

  return { ...query, syncTags: mutation.mutate, isSyncing: mutation.isPending }
}
