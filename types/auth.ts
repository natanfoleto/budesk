import { User, UserRole } from "@prisma/client"

export interface JWTPayload {
  id: string;
  email: string;
  role: UserRole;
  [key: string]: unknown; // Allow other standard JWT claims (iat, exp, etc)
}

export type UserSafe = Omit<User, "password">;

export interface LoginResponse {
    user: UserSafe;
    token?: string; // If using manual JWT
}
