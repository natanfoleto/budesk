import { EmployeeTag } from "@prisma/client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export const useEmployeeTags = () => {
  return useQuery<EmployeeTag[]>({
    queryKey: ["employee-tags"],
    queryFn: async () => {
      const res = await fetch("/api/employee-tags")
      if (!res.ok) throw new Error("Erro ao buscar etiquetas")
      return res.json()
    }
  })
}

export const useCreateEmployeeTag = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; color: string }) => {
      const res = await fetch("/api/employee-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Erro ao criar etiqueta")
      }
      return res.json()
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
    mutationFn: async ({ id, ...data }: { id: string; name?: string; color?: string; employeeIds?: string[] }) => {
      const res = await fetch(`/api/employee-tags/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Erro ao atualizar etiqueta")
      }
      return res.json()
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
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/employee-tags/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Erro ao excluir etiqueta")
      }
      return res.json()
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
    queryFn: async () => {
      const res = await fetch(`/api/employees/${employeeId}/tags`)
      if (!res.ok) throw new Error("Erro ao buscar etiquetas do funcionário")
      return res.json()
    },
    enabled: !!employeeId
  })

  const mutation = useMutation({
    mutationFn: async (tagIds: string[]) => {
      const res = await fetch(`/api/employees/${employeeId}/tags`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagIds }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Erro ao atualizar etiquetas")
      }
      return res.json()
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
