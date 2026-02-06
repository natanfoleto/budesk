import { User as PrismaUser } from "@prisma/client"

export type User = Omit<PrismaUser, "password" | "createdAt" | "updatedAt"> & {
  createdAt: string
  updatedAt: string
}
