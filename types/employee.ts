import {
  Employee,
  EmployeeAccount,
  EmployeeAccountType,
  EmployeeAdvance,
  EmployeeContract,
  EmploymentRecord,
  FinancialTransaction,
} from "@prisma/client"

export interface EmployeeWithDetails extends Employee {
  advances?: EmployeeAdvance[];
  transactions?: FinancialTransaction[];
  employmentRecords?: EmploymentRecord[];
  contracts?: EmployeeContract[];
  job?: { id: string; name: string };
  tags?: { id: string; name: string; color: string }[];
  accounts?: EmployeeAccount[];
  terminationDate?: string | Date | null;
}

export interface EmployeeAccountFormData {
  type: EmployeeAccountType;
  identifier: string;
  description?: string;
  isDefault?: boolean;
}

export interface EmployeeFormData {
  name: string;
  document?: string;
  email?: string;
  phone?: string;
  role?: string;
  jobId?: string;
  salaryInCents: number;
  shirtSize?: string;
  pantsSize?: string;
  shoeSize?: string;
  plantingCategory?: string;
}

export interface EmploymentRecordFormData {
  admissionDate: string;
  terminationDate?: string;
  jobTitle: string;
  baseSalary: number;
  contractType: string;
  weeklyWorkload?: number;
  workRegime?: string;
  isActive: boolean;
  hasMedicalExam: boolean;
  hasSignedRegistration: boolean;
  hasSignedEpiReceipt: boolean;
  notes?: string;
}

export interface ContractFormData {
  type: string;
  startDate: string;
  endDate?: string;
  valueInCents: number;
  status: "ACTIVE" | "FINISHED" | "TERMINATED";
  description?: string;
  fileUrl?: string;
}

export interface AdvanceFormData {
  valueInCents: number;
  date: string;
  note?: string;
  payrollReference?: string;
  paymentMethod: "DINHEIRO" | "PIX" | "CARTAO" | "BOLETO" | "CHEQUE" | "TRANSFERENCIA";
}

