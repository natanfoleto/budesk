import {
    User,
    Service,
    FinancialTransaction,
    Employee,
    Client,
    Supplier,
    Vehicle,
    Document,
    AuditLog,
    UserRole,
    ServiceStatus,
    TransactionType
} from "@prisma/client";

export type {
    User,
    Service,
    FinancialTransaction,
    Employee,
    Client,
    Supplier,
    Vehicle,
    Document,
    AuditLog
};

export {
    UserRole,
    ServiceStatus,
    TransactionType
};

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


export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    meta?: {
        page: number;
        limit: number;
        total: number;
    };
}

export interface UserSafe extends Omit<User, "password"> { }

export interface LoginResponse {
    user: UserSafe;
    token?: string; // If using manual JWT
}
