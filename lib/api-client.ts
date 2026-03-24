/**
 * Custom Error class to handle API errors with status codes
 */
export class ApiError extends Error {
  status: number
  data: unknown

  constructor(message: string, status: number, data?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.data = data
  }
}

/**
 * Standardized fetch wrapper
 */
export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  })

  if (!response.ok) {
    let errorData
    try {
      errorData = await response.json()
    } catch {
      errorData = { error: response.statusText }
    }

    throw new ApiError(
      errorData.error || "Algo deu errado",
      response.status,
      errorData
    )
  }

  // Handle empty responses
  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}

/**
 * Helper to download files with authentication and error handling
 */
export async function downloadFile(
  url: string,
  fileName: string,
  options: RequestInit = {}
): Promise<void> {
  const response = await fetch(url, {
    ...options,
  })

  if (!response.ok) {
    let errorData
    try {
      errorData = await response.json()
    } catch {
      errorData = { error: response.statusText }
    }

    throw new ApiError(
      errorData.error || "Algo deu errado ao baixar o arquivo",
      response.status,
      errorData
    )
  }

  const blob = await response.blob()
  const downloadUrl = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = downloadUrl
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(downloadUrl)
  document.body.removeChild(a)
}
