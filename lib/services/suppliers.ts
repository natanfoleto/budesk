import { apiRequest } from "@/lib/api-client"
import { FindManySupplierArgs,SupplierFormData, SupplierWithDetails } from "@/types/supplier"

const BASE_URL = "/api"

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export const getSuppliers = async (params: FindManySupplierArgs = {}): Promise<PaginatedResponse<SupplierWithDetails>> => {
  const query = new URLSearchParams()
  if (params.page) query.append("page", params.page.toString())
  if (params.limit) query.append("limit", params.limit.toString())
  if (params.name) query.append("name", params.name)
  if (params.document) query.append("document", params.document)
  if (params.city) query.append("city", params.city)
  if (params.active !== undefined) query.append("active", params.active.toString())

  return apiRequest<PaginatedResponse<SupplierWithDetails>>(`${BASE_URL}/suppliers?${query.toString()}`)
}

export const createSupplier = async (data: SupplierFormData) => {
  return apiRequest(`${BASE_URL}/suppliers`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export const getSupplier = async (id: string): Promise<SupplierWithDetails> => {
  return apiRequest<SupplierWithDetails>(`${BASE_URL}/suppliers/${id}`)
}

export const updateSupplier = async (id: string, data: Partial<SupplierFormData>) => {
  return apiRequest(`${BASE_URL}/suppliers/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export const deleteSupplier = async (id: string): Promise<{ message: string }> => {
  return apiRequest<{ message: string }>(`${BASE_URL}/suppliers/${id}`, {
    method: "DELETE",
  })
}
