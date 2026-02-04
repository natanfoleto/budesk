import {
  Employee,
  EmployeeAdvance,
  EmployeeContract,
  EmploymentRecord,
  FinancialTransaction,
  TimeRecord,
} from "@prisma/client"

export interface EmployeeWithDetails extends Employee {
  advances?: EmployeeAdvance[];
  transactions?: FinancialTransaction[];
  employmentRecords?: EmploymentRecord[];
  contracts?: EmployeeContract[];
  timeRecords?: TimeRecord[];
}

export interface EmployeeFormData {
  name: string;
  document?: string;
  email?: string;
  phone?: string;
  role: string;
  salaryInCents: number;
  shirtSize?: string;
  pantsSize?: string;
  shoeSize?: string;
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
  notes?: string;
}

export interface ContractFormData {
  type: string;
  startDate: string;
  endDate?: string;
  value: number;
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

export interface TimeRecordFormData {
  date: string;
  entryTime: string;
  exitTime?: string;
  absent: boolean;
  justification?: string;
  manualWorkedHours?: number;
  manualOvertime?: number;
}
