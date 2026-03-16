export interface Job {
  id: string
  name: string
  description?: string | null
  active: boolean
  createdAt: string | Date
  updatedAt: string | Date
}

export interface JobFormData {
  name: string
  description?: string
  active?: boolean
}

export async function getJobs() {
  const res = await fetch("/api/jobs")
  if (!res.ok) throw new Error("Erro ao buscar cargos")
  return res.json()
}

export async function createJob(data: JobFormData) {
  const res = await fetch("/api/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Erro ao criar cargo")
  return res.json()
}

export async function updateJob(id: string, data: Partial<JobFormData>) {
  const res = await fetch(`/api/jobs/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Erro ao atualizar cargo")
  return res.json()
}

export async function deleteJob(id: string) {
  const res = await fetch(`/api/jobs/${id}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Erro ao excluir cargo")
  return res.json()
}
