
import { UserRole } from "@prisma/client"
import { useQuery } from "@tanstack/react-query"

interface User {
  id: string
  name: string
  email: string
  role: UserRole
}

export const useUser = () => {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me")
      if (!response.ok) {
        throw new Error("Failed to fetch user")
      }
      const data = await response.json()
      return data.user as User | null
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  })
}
