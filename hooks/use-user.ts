
import { UserRole } from "@prisma/client"
import { useQuery } from "@tanstack/react-query"

import { apiRequest } from "@/lib/api-client"

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
      const data = await apiRequest<{ user: User | null }>("/api/auth/me")
      return data.user
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  })
}
