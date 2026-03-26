import { PersonType, Supplier as PrismaSupplier, SupplierAccountType } from "@prisma/client"

export type Supplier = PrismaSupplier

export interface SupplierFormData {
  name: string;
  tradeName?: string | null;
  personType: PersonType;
  document?: string | null;
  stateRegistration?: string | null;
  municipalRegistration?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  contactName?: string | null;
  zipCode?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  bank?: string | null;
  branch?: string | null;
  account?: string | null;
  accountType?: SupplierAccountType | null;
  pixKey?: string | null;
  active?: boolean;
  notes?: string | null;
}

export type SupplierWithDetails = Supplier;

export interface FindManySupplierArgs {
  name?: string;
  document?: string;
  city?: string;
  active?: string; // Comes as string from query "true"|"false"|"all"
  page?: number;
  limit?: number;
}
