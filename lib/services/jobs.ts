import { apiRequest } from "@/lib/api-client"

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
  return apiRequest<Job[]>("/api/jobs")
}

export async function createJob(data: JobFormData) {
  return apiRequest("/api/jobs", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateJob(id: string, data: Partial<JobFormData>) {
  return apiRequest(`/api/jobs/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export async function deleteJob(id: string) {
  return apiRequest(`/api/jobs/${id}`, {
    method: "DELETE",
  })
}
