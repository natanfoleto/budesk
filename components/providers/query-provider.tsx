"use client"

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { ApiError } from "@/lib/api-client"

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  const handleUnauthorized = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/")
      router.refresh()
      toast.error("Sessão expirada. Por favor, faça login novamente.")
    } catch (error) {
      console.error("Logout error:", error)
      window.location.href = "/"
    }
  }

  const [queryClient] = useState(() => new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        if (error instanceof ApiError && error.status === 401) {
          handleUnauthorized()
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        if (error instanceof ApiError && error.status === 401) {
          handleUnauthorized()
        }
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.status === 401) {
            return false
          }
          return failureCount < 3
        },
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
