import {
  AuditLog,
  Client,
  Document,
  Employee,
  FinancialTransaction,
  Service,
  ServiceStatus,
  Supplier,
  TransactionType,
  User,
  UserRole,
  Vehicle} from "@prisma/client"

export type {
  AuditLog,
  Client,
  Document,
  Employee,
  FinancialTransaction,
  Service,
  Supplier,
  User,
  Vehicle}

export {
  ServiceStatus,
  TransactionType,
  UserRole}

export enum VehicleType {
    CARRO = "CARRO",
    MOTO = "MOTO",
    CAMINHAO = "CAMINHAO",
    ONIBUS = "ONIBUS",
    MAQUINA = "MAQUINA",
    OUTRO = "OUTRO"
}

export enum AuditAction {
    CREATE = "CREATE",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
    LOGIN = "LOGIN",
}


export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}

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
