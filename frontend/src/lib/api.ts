import axios from 'axios';

// API base URL - must be set via NEXT_PUBLIC_API_URL environment variable in production
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? window.location.origin.replace(':3000', ':3001') : '');

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000, // 5 second timeout for faster failure detection
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Build error info object safely
    const errorInfo: any = {
      message: error.message || 'Unknown error',
      url: error.config?.url || 'Unknown URL',
    };

    if (error.response) {
      // Server responded with error status
      errorInfo.status = error.response.status;
      errorInfo.statusText = error.response.statusText;
      errorInfo.data = error.response.data;
    } else if (error.request) {
      // Request was made but no response received
      errorInfo.type = 'Network Error';
      errorInfo.message = 'No response from server. Please check your connection.';
    } else {
      // Something else happened
      errorInfo.type = 'Request Setup Error';
    }

    if (error.code) {
      errorInfo.code = error.code;
    }

    console.error('❌ API Error:', errorInfo);
    
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('tenant');
      // Redirect to login if not already on login page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Test API connectivity
export const testAPI = {
  test: () => {
    console.log('🔍 Testing API connectivity to:', API_BASE_URL);
    return api.get('/test');
  },
  testWithFetch: async () => {
    console.log('🔍 Testing API connectivity with fetch to:', `${API_BASE_URL}/api/test`);
    try {
      const response = await fetch(`${API_BASE_URL}/api/test`);
      const data = await response.json();
      console.log('✅ Fetch test successful:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Fetch test failed:', error);
      return { success: false, error };
    }
  }
};

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string }) => {
    console.log('🔍 Attempting login with:', { email: credentials.email, apiUrl: API_BASE_URL });
    return api.post('/auth/login', credentials);
  },
  register: (userData: { email: string; password: string; firstName: string; lastName: string; tenantName: string }) =>
    api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: { firstName?: string; lastName?: string; email?: string }) =>
    api.put('/auth/profile', data),
};

// Customer API
export const customerAPI = {
  getCustomers: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/customers', { params }),
  getCustomer: (id: string) => api.get(`/customers/${id}`),
  createCustomer: (data: any) => api.post('/customers', data),
  updateCustomer: (id: string, data: any) => api.put(`/customers/${id}`, data),
  deleteCustomer: (id: string) => api.delete(`/customers/${id}`),
};

// Invoice API
export const invoiceAPI = {
  getInvoices: (params?: { page?: number; limit?: number; status?: string; customerId?: string; startDate?: string; endDate?: string }) =>
    api.get('/invoices', { params }),
  getInvoice: (id: string) => api.get(`/invoices/${id}`),
  createInvoice: (data: any) => api.post('/invoices', data),
  updateInvoice: (id: string, data: any) => api.put(`/invoices/${id}`, data),
  deleteInvoice: (id: string) => api.delete(`/invoices/${id}`),
  sendInvoice: (id: string) => api.post(`/invoices/${id}/send`),
  voidInvoice: (id: string) => api.post(`/invoices/${id}/void`),
  downloadPDF: (id: string) => api.get(`/invoices/${id}/pdf`, { responseType: 'text' }),
};

// Recurring Invoice API
export const recurringInvoiceAPI = {
  getRecurringInvoices: (params?: { page?: number; limit?: number; status?: string; customerId?: string; frequency?: string }) =>
    api.get('/recurring-invoices', { params }),
  getRecurringInvoice: (id: string) => api.get(`/recurring-invoices/${id}`),
  createRecurringInvoice: (data: any) => api.post('/recurring-invoices', data),
  updateRecurringInvoice: (id: string, data: any) => api.put(`/recurring-invoices/${id}`, data),
  deleteRecurringInvoice: (id: string) => api.delete(`/recurring-invoices/${id}`),
  toggleStatus: (id: string) => api.post(`/recurring-invoices/${id}/toggle-status`),
  generateInvoice: (id: string) => api.post(`/recurring-invoices/${id}/generate`),
  duplicateRecurringInvoice: (id: string) => api.post(`/recurring-invoices/${id}/duplicate`),
  downloadPDF: (id: string) => api.get(`/recurring-invoices/${id}/pdf`, { responseType: 'text' }),
};

// Product API
export const productAPI = {
  getProducts: (params?: { page?: number; limit?: number; search?: string; category?: string }) =>
    api.get('/products', { params }),
  getProduct: (id: string) => api.get(`/products/${id}`),
  createProduct: (data: any) => api.post('/products', data),
  updateProduct: (id: string, data: any) => api.put(`/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/products/${id}`),
  getCategories: () => api.get('/products/categories'),
  getLowStockProducts: () => api.get('/products/low-stock'),
  updateStock: (id: string, data: { quantity: number }) => api.patch(`/products/${id}/stock`, data),
};

// Expense API
export const expenseAPI = {
  getExpenses: (params?: { page?: number; limit?: number; category?: string; vendorId?: string; startDate?: string; endDate?: string }) =>
    api.get('/expenses', { params }),
  getExpense: (id: string) => api.get(`/expenses/${id}`),
  createExpense: (data: any) => api.post('/expenses', data),
  updateExpense: (id: string, data: any) => api.put(`/expenses/${id}`, data),
  deleteExpense: (id: string) => api.delete(`/expenses/${id}`),
  getExpenseSummary: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/expenses/summary', { params }),
};

// Settings API
export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  getAllSettings: () => api.get('/settings/all'),
  updateTenantSettings: (data: any) => api.put('/settings/tenant', data),
  updateProfileSettings: (data: any) => api.put('/settings/profile', data),
  updatePreferences: (data: any) => api.put('/settings/preferences', data),
  updateCompanyDetails: (data: any) => api.put('/settings/company-details', data),
  updateTaxSettings: (data: any) => api.put('/settings/tax', data),
  updatePaymentSettings: (data: any) => api.put('/settings/payments', data),
  updateLocalizationSettings: (data: any) => api.put('/settings/localization', data),
  updateProductSettings: (data: any) => api.put('/settings/products', data),
  updateTaskSettings: (data: any) => api.put('/settings/tasks', data),
  updateExpenseSettings: (data: any) => api.put('/settings/expenses', data),
  updateWorkflowSettings: (data: any) => api.put('/settings/workflows', data),
  updateNumberingSettings: (data: any) => api.put('/settings/numbering', data),
  updateEmailSettings: (data: any) => api.put('/settings/email', data),
  updateClientPortalSettings: (data: any) => api.put('/settings/client-portal', data),
  updateAdvancedSettings: (data: any) => api.put('/settings/advanced', data),
};

// Reports API
export const reportsAPI = {
  // Business Overview
  generateProfitLoss: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/reports/profit-loss', { params }),
  generateBalanceSheet: (params?: { asOfDate?: string }) =>
    api.get('/reports/balance-sheet', { params }),
  generateCashFlow: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/reports/cash-flow', { params }),
  generateTrialBalance: (params?: { asOfDate?: string }) =>
    api.get('/reports/trial-balance', { params }),
  generateGeneralLedger: (params?: { accountId?: string; startDate?: string; endDate?: string }) =>
    api.get('/reports/general-ledger', { params }),
  
  // Accounts Receivable
  generateAccountsReceivableAging: (params?: { asOfDate?: string }) =>
    api.get('/reports/accounts-receivable-aging', { params }),
  generateSalesByCustomer: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/reports/sales-by-customer', { params }),
  generateIncomeByCustomer: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/reports/income-by-customer', { params }),
  generateCustomerProfitability: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/reports/customer-profitability', { params }),
  
  // Accounts Payable
  generateAccountsPayableAging: (params?: { asOfDate?: string }) =>
    api.get('/reports/accounts-payable-aging', { params }),
  generateExpensesByVendor: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/reports/expenses-by-vendor', { params }),
  generateExpensesByCategory: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/reports/expenses-by-category', { params }),
  
  // Sales
  generateSalesByProduct: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/reports/sales-by-product', { params }),
  
  // Tax
  generateTaxSummary: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/reports/tax-summary', { params }),
  
  // Advanced Reports
  generateBudgetVsActual: (params?: { startDate?: string; endDate?: string; budgetId?: string }) =>
    api.get('/reports/budget-vs-actual', { params }),
  generateOwnersEquity: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/reports/owners-equity', { params }),
  generateCashFlowDirect: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/reports/cash-flow-direct', { params }),
  generateCashFlowIndirect: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/reports/cash-flow-indirect', { params }),
  generateProjectProfitability: (params?: { startDate?: string; endDate?: string; projectId?: string }) =>
    api.get('/reports/project-profitability', { params }),
};

// Reconciliation API
export const reconciliationAPI = {
  uploadBankStatement: (file: File, type: string = 'bank-statement') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return api.post('/reconciliation/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getBankTransactions: (params?: { startDate?: string; endDate?: string; status?: string; page?: number; limit?: number }) =>
    api.get('/reconciliation/transactions', { params }),
  getReconciliationSummary: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/reconciliation/summary', { params }),
  matchTransaction: (id: string, data?: { invoiceId?: string; expenseId?: string }) =>
    api.post(`/reconciliation/transactions/${id}/match`, data || {}),
  unmatchTransaction: (id: string) =>
    api.post(`/reconciliation/transactions/${id}/unmatch`),
};

// File API
export const fileAPI = {
  uploadFile: (file: File, type: string = 'bank-statement') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  uploadMultipleFiles: (files: File[], type: string = 'general') => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    formData.append('type', type);
    return api.post('/files/upload-multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getDownloadUrl: (key: string) => api.get(`/files/download/${key}`),
  listFiles: (params?: { type?: string; page?: number; limit?: number }) =>
    api.get('/files/list', { params }),
  deleteFile: (key: string) => api.delete(`/files/${key}`),
};

// Backup API
export const backupAPI = {
  getBackups: () => api.get('/backup'),
  createBackup: () => api.post('/backup'),
  downloadBackup: (id: string) => api.get(`/backup/${id}/download`, { responseType: 'blob' }),
  restoreBackup: (id: string) => api.post(`/backup/${id}/restore`),
  deleteBackup: (id: string) => api.delete(`/backup/${id}`),
};

// Integration API
export const integrationAPI = {
  getIntegrations: (params?: { page?: number; limit?: number; type?: string; isActive?: boolean; isConnected?: boolean }) =>
    api.get('/integrations', { params }),
  getIntegration: (id: string) => api.get(`/integrations/${id}`),
  createIntegration: (data: any) => api.post('/integrations', data),
  updateIntegration: (id: string, data: any) => api.put(`/integrations/${id}`, data),
  deleteIntegration: (id: string) => api.delete(`/integrations/${id}`),
  testIntegration: (id: string) => api.post(`/integrations/${id}/test`),
};

// Quotes API
export const quoteAPI = {
  getQuotes: (params?: { page?: number; limit?: number; status?: string; customerId?: string; startDate?: string; endDate?: string }) =>
    api.get('/quotes', { params }),
  getQuote: (id: string) => api.get(`/quotes/${id}`),
  createQuote: (data: any) => api.post('/quotes', data),
  updateQuote: (id: string, data: any) => api.put(`/quotes/${id}`, data),
  deleteQuote: (id: string) => api.delete(`/quotes/${id}`),
  approveQuote: (id: string) => api.post(`/quotes/${id}/approve`),
  convertQuote: (id: string, data?: any) => api.post(`/quotes/${id}/convert`, data),
};

// Payments API
export const paymentAPI = {
  getPayments: (params?: { page?: number; limit?: number; invoiceId?: string; paymentMethod?: string; startDate?: string; endDate?: string }) =>
    api.get('/payments', { params }),
  getPayment: (id: string) => api.get(`/payments/${id}`),
  createPayment: (data: any) => api.post('/payments', data),
  refundPayment: (id: string, data: any) => api.post(`/payments/${id}/refund`, data),
};

// Opening Balances API
export const openingBalanceAPI = {
  getOpeningBalances: (params?: { accountId?: string; asOfDate?: string }) =>
    api.get('/opening-balances', { params }),
  createOpeningBalance: (data: any) => api.post('/opening-balances', data),
  postOpeningBalances: (data: { asOfDate: string }) => api.post('/opening-balances/post', data),
};

// Financial Periods API
export const financialPeriodAPI = {
  getFinancialPeriods: (params?: { year?: number; isLocked?: boolean }) =>
    api.get('/financial-periods', { params }),
  getFinancialPeriod: (year: number, month: number) => api.get(`/financial-periods/${year}/${month}`),
  lockPeriod: (year: number, month: number) => api.post(`/financial-periods/${year}/${month}/lock`),
  unlockPeriod: (year: number, month: number, reason?: string) => api.post(`/financial-periods/${year}/${month}/unlock`, { reason }),
  updatePeriodSummary: (year: number, month: number) => api.post(`/financial-periods/${year}/${month}/update-summary`),
};

// Audit Logs API
export const auditLogAPI = {
  getAuditLogs: (params?: { page?: number; limit?: number; action?: string; entityType?: string; entityId?: string; userId?: string; startDate?: string; endDate?: string }) =>
    api.get('/audit-logs', { params }),
  getAuditLogSummary: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/audit-logs/summary', { params }),
};

// Payment Gateways API
export const paymentGatewayAPI = {
  createStripeIntent: (data: { invoiceId: string }) => api.post('/payment-gateways/stripe/create-intent', data),
  confirmStripePayment: (data: { paymentIntentId: string; invoiceId: string }) => api.post('/payment-gateways/stripe/confirm', data),
  createPayPalOrder: (data: { invoiceId: string; returnUrl?: string; cancelUrl?: string }) => api.post('/payment-gateways/paypal/create-order', data),
  capturePayPalPayment: (data: { orderId: string; invoiceId: string }) => api.post('/payment-gateways/paypal/capture', data),
};

// Payment Reminders API
export const paymentReminderAPI = {
  sendReminder: (invoiceId: string, reminderType?: string) => api.post(`/payment-reminders/${invoiceId}`, { reminderType }),
  sendOverdueReminders: (daysOverdue?: number) => api.post('/payment-reminders/overdue', { daysOverdue }),
  autoSendReminders: () => api.post('/payment-reminders/auto'),
};

// Chart of Accounts API
export const chartOfAccountAPI = {
  getAccounts: (params?: { type?: string; category?: string; isActive?: boolean }) =>
    api.get('/chart-of-accounts', { params }),
  getAccount: (id: string) => api.get(`/chart-of-accounts/${id}`),
  createAccount: (data: any) => api.post('/chart-of-accounts', data),
  updateAccount: (id: string, data: any) => api.put(`/chart-of-accounts/${id}`, data),
  deleteAccount: (id: string) => api.delete(`/chart-of-accounts/${id}`),
  initializeCOA: () => api.post('/chart-of-accounts/initialize'),
};

// Journal Entries API
export const journalEntryAPI = {
  getJournalEntries: (params?: { page?: number; limit?: number; entryType?: string; startDate?: string; endDate?: string }) =>
    api.get('/journal-entries', { params }),
  getJournalEntry: (id: string) => api.get(`/journal-entries/${id}`),
  createJournalEntry: (data: any) => api.post('/journal-entries', data),
  reverseJournalEntry: (id: string) => api.post(`/journal-entries/${id}/reverse`),
  getTrialBalance: (params?: { asOfDate?: string }) => api.get('/journal-entries/trial-balance', { params }),
};

// Payroll API
export const payrollAPI = {
  getPayrolls: (params?: { page?: number; limit?: number; employeeId?: string; status?: string; startDate?: string; endDate?: string }) =>
    api.get('/payroll', { params }),
  getPayroll: (id: string) => api.get(`/payroll/${id}`),
  createPayroll: (data: any) => api.post('/payroll', data),
  approvePayroll: (id: string) => api.post(`/payroll/${id}/approve`),
  postPayroll: (id: string) => api.post(`/payroll/${id}/post`),
  markPayrollPaid: (id: string) => api.post(`/payroll/${id}/pay`),
};

// Employees API
export const employeeAPI = {
  getEmployees: (params?: { page?: number; limit?: number; status?: string; department?: string; search?: string }) =>
    api.get('/employees', { params }),
  getEmployee: (id: string) => api.get(`/employees/${id}`),
  createEmployee: (data: any) => api.post('/employees', data),
  updateEmployee: (id: string, data: any) => api.put(`/employees/${id}`, data),
  deleteEmployee: (id: string) => api.delete(`/employees/${id}`),
};

// Bank Rules API
export const bankRuleAPI = {
  getBankRules: (params?: { page?: number; limit?: number; isActive?: boolean }) =>
    api.get('/bank-rules', { params }),
  getBankRule: (id: string) => api.get(`/bank-rules/${id}`),
  createBankRule: (data: any) => api.post('/bank-rules', data),
  updateBankRule: (id: string, data: any) => api.put(`/bank-rules/${id}`, data),
  deleteBankRule: (id: string) => api.delete(`/bank-rules/${id}`),
  testBankRule: (id: string, transactionIds: string[]) => api.post(`/bank-rules/${id}/test`, { transactionIds }),
  applyBankRules: (transactionIds: string[]) => api.post('/bank-rules/apply', { transactionIds }),
};

// Fixed Assets API
export const fixedAssetAPI = {
  getFixedAssets: (params?: { page?: number; limit?: number; status?: string; category?: string; search?: string }) =>
    api.get('/fixed-assets', { params }),
  getFixedAsset: (id: string) => api.get(`/fixed-assets/${id}`),
  createFixedAsset: (data: any) => api.post('/fixed-assets', data),
  updateFixedAsset: (id: string, data: any) => api.put(`/fixed-assets/${id}`, data),
  deleteFixedAsset: (id: string) => api.delete(`/fixed-assets/${id}`),
  calculateDepreciation: (id: string, data: { asOfDate?: string }) => api.post(`/fixed-assets/${id}/calculate-depreciation`, data),
  postDepreciation: (id: string, data: { asOfDate?: string; amount: number }) => api.post(`/fixed-assets/${id}/post-depreciation`, data),
  disposeAsset: (id: string, data: { disposalDate?: string; disposalAmount?: number; disposalMethod?: string; disposalAccountId?: string; gainLossAccountId?: string }) => api.post(`/fixed-assets/${id}/dispose`, data),
  getDepreciationSchedule: (id: string) => api.get(`/fixed-assets/${id}/depreciation-schedule`),
};

// Client Portal API
export const clientAuthAPI = {
  register: (data: { email: string; password: string; customerId: string; tenantId: string }) =>
    api.post('/client-auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/client-auth/login', data),
  getMe: () => api.get('/client-auth/me'),
};

export const clientPortalAPI = {
  getDashboard: () => api.get('/client-portal/dashboard'),
  getInvoices: (params?: { status?: string }) => api.get('/client-portal/invoices', { params }),
  getInvoice: (id: string) => api.get(`/client-portal/invoices/${id}`),
  getQuotes: (params?: { status?: string }) => api.get('/client-portal/quotes', { params }),
  getPayments: () => api.get('/client-portal/payments'),
};

// Workflows API
export const workflowAPI = {
  getWorkflows: (params?: { page?: number; limit?: number; isActive?: boolean; triggerType?: string }) =>
    api.get('/workflows', { params }),
  getWorkflow: (id: string) => api.get(`/workflows/${id}`),
  createWorkflow: (data: any) => api.post('/workflows', data),
  updateWorkflow: (id: string, data: any) => api.put(`/workflows/${id}`, data),
  deleteWorkflow: (id: string) => api.delete(`/workflows/${id}`),
  testWorkflow: (id: string, context?: any) => api.post(`/workflows/${id}/test`, { context }),
  toggleWorkflow: (id: string) => api.post(`/workflows/${id}/toggle`),
};

// Dashboard API
export const dashboardAPI = {
  getDashboard: () => api.get('/dashboard'),
};

export default api;




