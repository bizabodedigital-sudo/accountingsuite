export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'OWNER' | 'ACCOUNTANT' | 'STAFF' | 'READONLY';
  tenantId: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  _id: string;
  name: string;
  currency: string;
  plan: 'STARTER' | 'PRO' | 'PREMIUM' | 'ENTERPRISE';
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  dateFormat?: string;
  theme?: string;
  settings?: {
    timezone?: string;
    dateFormat?: string;
    invoicePrefix?: string;
    invoiceNumber?: number;
    [key: string]: any;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    parish?: string;
    country?: string;
  };
  taxId?: string;
  notes?: string;
  tenantId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  _id: string;
  number: string;
  type: 'INVOICE' | 'CREDIT_NOTE' | 'QUOTE' | 'PURCHASE_ORDER';
  customerId: string | Customer;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  dueDate: string;
  issueDate: string;
  paidDate?: string;
  notes?: string;
  tenantId: string;
  createdBy: string | User;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringInvoice {
  _id: string;
  name: string;
  description?: string;
  customerId: string | Customer;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
  interval: number;
  startDate: string;
  endDate?: string;
  nextRunDate: string;
  lastRunDate?: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  isActive: boolean;
  notes?: string;
  poNumber?: string;
  totalGenerated: number;
  lastGeneratedInvoiceId?: string | Invoice;
  tenantId: string;
  createdBy: string | User;
  lastModifiedBy?: string | User;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  _id: string;
  description: string;
  amount: number;
  category: 'OFFICE_SUPPLIES' | 'UTILITIES' | 'RENT' | 'INSURANCE' | 'MARKETING' | 'TRAVEL' | 'MEALS' | 'EQUIPMENT' | 'PROFESSIONAL_SERVICES' | 'OTHER';
  vendorId: string | Customer;
  date: string;
  receipt?: {
    filename: string;
    url: string;
    uploadedAt: string;
  };
  isReimbursable: boolean;
  isTaxDeductible: boolean;
  notes?: string;
  tenantId: string;
  createdBy: string | User;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  tenant: Tenant;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface InvoiceParams extends PaginationParams {
  status?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
}

export interface ExpenseParams extends PaginationParams {
  category?: string;
  vendorId?: string;
  startDate?: string;
  endDate?: string;
}









