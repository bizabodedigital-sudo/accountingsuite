'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { invoiceAPI, expenseAPI, customerAPI, productAPI, reportsAPI, chartOfAccountAPI } from '@/lib/api';
import {
  Download,
  Filter,
  BarChart2,
  PieChart,
  LineChart,
  TrendingUp,
  Users,
  DollarSign,
  FileText,
  Building2,
  CreditCard,
  Package,
  Settings,
  Eye,
  Share2,
  Clock,
  Banknote as BanknoteIcon,
  Search,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Receipt,
  TrendingDown,
} from 'lucide-react';

interface Report {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  requiresDateRange?: boolean;
  requiresAsOfDate?: boolean;
  requiresAccount?: boolean;
  apiMethod: string;
}

export default function ReportsPage() {
  const { user, tenant, isLoading, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [reportData, setReportData] = useState({
    totalInvoices: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    totalCustomers: 0,
    totalProducts: 0,
    pendingInvoices: 0,
    paidInvoices: 0,
    overdueInvoices: 0
  });
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const [currentReport, setCurrentReport] = useState<any>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);

  // Load report data from APIs
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      loadReportData();
      loadAccounts();
    }
  }, [isLoading, isAuthenticated]);

  const loadAccounts = async () => {
    try {
      const response = await chartOfAccountAPI.getAccounts({ isActive: true });
      setAccounts(response.data.data || []);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  };

  const loadReportData = async () => {
    try {
      console.log('🔄 Loading report data from APIs...');
      
      const [invoicesRes, expensesRes, customersRes, productsRes] = await Promise.all([
        invoiceAPI.getInvoices(),
        expenseAPI.getExpenses(),
        customerAPI.getCustomers(),
        productAPI.getProducts()
      ]);

      const invoices = invoicesRes.data.data || [];
      const expenses = expensesRes.data.data || [];
      const customers = customersRes.data.data || [];
      const products = productsRes.data.data || [];

      const totalRevenue = invoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);
      const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);
      const pendingInvoices = invoices.filter((inv: any) => inv.status === 'SENT').length;
      const paidInvoices = invoices.filter((inv: any) => inv.status === 'PAID').length;
      const overdueInvoices = invoices.filter((inv: any) => inv.status === 'OVERDUE').length;

      setReportData({
        totalInvoices: invoices.length,
        totalRevenue,
        totalExpenses,
        totalCustomers: customers.length,
        totalProducts: products.length,
        pendingInvoices,
        paidInvoices,
        overdueInvoices
      });

      console.log('✅ Report data loaded successfully');
    } catch (err) {
      console.error('❌ Failed to load report data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/login';
    }
  }, [isLoading, isAuthenticated]);

  const reportCategories = [
    'All',
    'Business Overview',
    'Accounts Receivable',
    'Accounts Payable',
    'Sales & Customer',
    'Expenses & Vendor',
    'Tax Reports',
  ];

  const reports: Report[] = [
    // Business Overview Reports
    {
      id: 'profit-loss',
      name: 'Profit and Loss (P&L)',
      description: 'Shows income, expenses, and net profit over a period.',
      category: 'Business Overview',
      icon: TrendingUp,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      requiresDateRange: true,
      apiMethod: 'generateProfitLoss'
    },
    {
      id: 'balance-sheet',
      name: 'Balance Sheet',
      description: 'Lists assets, liabilities, and equity as of a specific date.',
      category: 'Business Overview',
      icon: PieChart,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      requiresAsOfDate: true,
      apiMethod: 'generateBalanceSheet'
    },
    {
      id: 'cash-flow',
      name: 'Cash Flow Statement',
      description: 'Displays cash inflows/outflows from operations, investing, and financing.',
      category: 'Business Overview',
      icon: LineChart,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
      requiresDateRange: true,
      apiMethod: 'generateCashFlow'
    },
    {
      id: 'trial-balance',
      name: 'Trial Balance',
      description: 'Shows all account balances to verify debits equal credits.',
      category: 'Business Overview',
      icon: BarChart2,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20',
      borderColor: 'border-indigo-200 dark:border-indigo-800',
      requiresAsOfDate: true,
      apiMethod: 'generateTrialBalance'
    },
    {
      id: 'general-ledger',
      name: 'General Ledger',
      description: 'Detailed transaction history for a specific account with running balance.',
      category: 'Business Overview',
      icon: FileText,
      color: 'text-cyan-600 dark:text-cyan-400',
      bgColor: 'bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20',
      borderColor: 'border-cyan-200 dark:border-cyan-800',
      requiresDateRange: true,
      requiresAccount: true,
      apiMethod: 'generateGeneralLedger'
    },
    
    // Accounts Receivable Reports
    {
      id: 'ar-aging',
      name: 'Accounts Receivable Aging',
      description: 'Shows outstanding invoices grouped by how long they\'ve been overdue.',
      category: 'Accounts Receivable',
      icon: Clock,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800',
      requiresAsOfDate: true,
      apiMethod: 'generateAccountsReceivableAging'
    },
    {
      id: 'sales-by-customer',
      name: 'Sales by Customer',
      description: 'Shows which customers bring in the most income.',
      category: 'Sales & Customer',
      icon: Users,
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20',
      borderColor: 'border-teal-200 dark:border-teal-800',
      requiresDateRange: true,
      apiMethod: 'generateSalesByCustomer'
    },
    {
      id: 'income-by-customer',
      name: 'Income by Customer Summary',
      description: 'Detailed breakdown of revenue by customer with invoice details.',
      category: 'Accounts Receivable',
      icon: DollarSign,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
      requiresDateRange: true,
      apiMethod: 'generateIncomeByCustomer'
    },
    {
      id: 'customer-profitability',
      name: 'Customer Profitability',
      description: 'Analyzes which customers are most profitable to your business.',
      category: 'Sales & Customer',
      icon: TrendingUp,
      color: 'text-lime-600 dark:text-lime-400',
      bgColor: 'bg-gradient-to-br from-lime-50 to-green-50 dark:from-lime-900/20 dark:to-green-900/20',
      borderColor: 'border-lime-200 dark:border-lime-800',
      requiresDateRange: true,
      apiMethod: 'generateCustomerProfitability'
    },
    
    // Accounts Payable Reports
    {
      id: 'ap-aging',
      name: 'Accounts Payable Aging',
      description: 'Shows outstanding expenses grouped by how long they\'ve been unpaid.',
      category: 'Accounts Payable',
      icon: Receipt,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      requiresAsOfDate: true,
      apiMethod: 'generateAccountsPayableAging'
    },
    {
      id: 'expenses-by-vendor',
      name: 'Expenses by Vendor',
      description: 'Tracks where your money is going and who you pay the most.',
      category: 'Expenses & Vendor',
      icon: Building2,
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20',
      borderColor: 'border-pink-200 dark:border-pink-800',
      requiresDateRange: true,
      apiMethod: 'generateExpensesByVendor'
    },
    {
      id: 'expenses-by-category',
      name: 'Expenses by Category',
      description: 'Breaks down expenses by category to identify spending patterns.',
      category: 'Expenses & Vendor',
      icon: CreditCard,
      color: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/20',
      borderColor: 'border-rose-200 dark:border-rose-800',
      requiresDateRange: true,
      apiMethod: 'generateExpensesByCategory'
    },
    
    // Sales Reports
    {
      id: 'sales-by-product',
      name: 'Sales by Product',
      description: 'Shows which products or services generate the most revenue.',
      category: 'Sales & Customer',
      icon: Package,
      color: 'text-violet-600 dark:text-violet-400',
      bgColor: 'bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20',
      borderColor: 'border-violet-200 dark:border-violet-800',
      requiresDateRange: true,
      apiMethod: 'generateSalesByProduct'
    },
    
    // Tax Reports
    {
      id: 'tax-summary',
      name: 'Tax Summary',
      description: 'Summarizes taxable income, deductions, and estimated tax liability.',
      category: 'Tax Reports',
      icon: FileText,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20',
      borderColor: 'border-amber-200 dark:border-amber-800',
      requiresDateRange: true,
      apiMethod: 'generateTaxSummary'
    },
    
    // Advanced Reports
    {
      id: 'budget-vs-actual',
      name: 'Budget vs Actual',
      description: 'Compares budgeted amounts to actual income and expenses.',
      category: 'Business Overview',
      icon: TrendingDown,
      color: 'text-slate-600 dark:text-slate-400',
      bgColor: 'bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20',
      borderColor: 'border-slate-200 dark:border-slate-800',
      requiresDateRange: true,
      apiMethod: 'generateBudgetVsActual'
    },
    {
      id: 'owners-equity',
      name: 'Statement of Owner\'s Equity',
      description: 'Shows changes in owner\'s equity over a period.',
      category: 'Business Overview',
      icon: Building2,
      color: 'text-sky-600 dark:text-sky-400',
      bgColor: 'bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20',
      borderColor: 'border-sky-200 dark:border-sky-800',
      requiresDateRange: true,
      apiMethod: 'generateOwnersEquity'
    },
    {
      id: 'cash-flow-direct',
      name: 'Cash Flow (Direct Method)',
      description: 'Cash flow statement using direct method (cash receipts and payments).',
      category: 'Business Overview',
      icon: LineChart,
      color: 'text-fuchsia-600 dark:text-fuchsia-400',
      bgColor: 'bg-gradient-to-br from-fuchsia-50 to-pink-50 dark:from-fuchsia-900/20 dark:to-pink-900/20',
      borderColor: 'border-fuchsia-200 dark:border-fuchsia-800',
      requiresDateRange: true,
      apiMethod: 'generateCashFlowDirect'
    },
    {
      id: 'cash-flow-indirect',
      name: 'Cash Flow (Indirect Method)',
      description: 'Cash flow statement using indirect method (net income adjustments).',
      category: 'Business Overview',
      icon: LineChart,
      color: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20',
      borderColor: 'border-rose-200 dark:border-rose-800',
      requiresDateRange: true,
      apiMethod: 'generateCashFlowIndirect'
    },
    {
      id: 'project-profitability',
      name: 'Project Profitability',
      description: 'Analyzes profitability by project or customer.',
      category: 'Sales & Customer',
      icon: TrendingUp,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
      requiresDateRange: true,
      apiMethod: 'generateProjectProfitability'
    },
  ];

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || report.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleGenerateReport = async (report: Report): Promise<void> => {
    try {
      setGeneratingReport(report.id);
      console.log('Generating report:', report.name);
      
      let response;
      const params: any = {};
      
      if (report.requiresDateRange) {
        params.startDate = dateRange.start;
        params.endDate = dateRange.end;
      }
      
      if (report.requiresAsOfDate) {
        params.asOfDate = asOfDate;
      }
      
      // Call the appropriate API method
      switch (report.apiMethod) {
        case 'generateProfitLoss':
          response = await reportsAPI.generateProfitLoss(params);
          break;
        case 'generateBalanceSheet':
          response = await reportsAPI.generateBalanceSheet(params);
          break;
        case 'generateCashFlow':
          response = await reportsAPI.generateCashFlow(params);
          break;
        case 'generateTrialBalance':
          response = await reportsAPI.generateTrialBalance(params);
          break;
        case 'generateGeneralLedger':
          // General Ledger requires accountId - we'll need to add account selection
          if (!params.accountId) {
            alert('Please select an account for General Ledger report');
            return;
          }
          response = await reportsAPI.generateGeneralLedger(params);
          break;
        case 'generateAccountsReceivableAging':
          response = await reportsAPI.generateAccountsReceivableAging(params);
          break;
        case 'generateSalesByCustomer':
          response = await reportsAPI.generateSalesByCustomer(params);
          break;
        case 'generateIncomeByCustomer':
          response = await reportsAPI.generateIncomeByCustomer(params);
          break;
        case 'generateCustomerProfitability':
          response = await reportsAPI.generateCustomerProfitability(params);
          break;
        case 'generateAccountsPayableAging':
          response = await reportsAPI.generateAccountsPayableAging(params);
          break;
        case 'generateExpensesByVendor':
          response = await reportsAPI.generateExpensesByVendor(params);
          break;
        case 'generateExpensesByCategory':
          response = await reportsAPI.generateExpensesByCategory(params);
          break;
        case 'generateSalesByProduct':
          response = await reportsAPI.generateSalesByProduct(params);
          break;
        case 'generateTaxSummary':
          response = await reportsAPI.generateTaxSummary(params);
          break;
        case 'generateBudgetVsActual':
          response = await reportsAPI.generateBudgetVsActual(params);
          break;
        case 'generateOwnersEquity':
          response = await reportsAPI.generateOwnersEquity(params);
          break;
        case 'generateCashFlowDirect':
          response = await reportsAPI.generateCashFlowDirect(params);
          break;
        case 'generateCashFlowIndirect':
          response = await reportsAPI.generateCashFlowIndirect(params);
          break;
        case 'generateProjectProfitability':
          response = await reportsAPI.generateProjectProfitability(params);
          break;
        default:
          throw new Error('Unknown report type');
      }
      
      setCurrentReport({ ...response.data, reportName: report.name });
      setShowReportModal(true);
      console.log('Report generated:', response.data);
    } catch (err: any) {
      console.error('Failed to generate report:', err);
      alert(`Failed to generate report: ${err.response?.data?.error || err.message}`);
    } finally {
      setGeneratingReport(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return `J$ ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const renderReportContent = () => {
    if (!currentReport) return null;
    
    const data = currentReport.data || currentReport;
    
    // Profit & Loss
    if (data.revenue && data.expenses && data.profit) {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">Total Revenue</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{formatCurrency(data.revenue.total)}</p>
              <p className="text-xs text-green-600 dark:text-green-400">{data.revenue.invoiceCount} invoices</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">Total Expenses</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">{formatCurrency(data.expenses.total)}</p>
              <p className="text-xs text-red-600 dark:text-red-400">{data.expenses.expenseCount} expenses</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm text-blue-600 dark:text-blue-400">Net Profit</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(data.profit.net)}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">Margin: {data.profit.margin}%</p>
            </div>
          </div>
          
          {data.expenses.byCategory && Object.keys(data.expenses.byCategory).length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Expenses by Category</h3>
              <div className="space-y-2">
                {Object.entries(data.expenses.byCategory).map(([category, amount]: [string, any]) => (
                  <div key={category} className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-300">{category.replace(/_/g, ' ')}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    
    // Balance Sheet
    if (data.assets && data.liabilities && data.equity) {
      return (
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border-2 border-blue-200 dark:border-blue-800">
            <h3 className="font-bold text-lg mb-4 text-blue-900 dark:text-blue-100">ASSETS</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">Cash</span>
                <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(data.assets.cash)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">Accounts Receivable</span>
                <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(data.assets.accountsReceivable)}</span>
              </div>
              <div className="border-t border-blue-300 dark:border-blue-700 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg text-blue-900 dark:text-blue-100">Total Assets</span>
                  <span className="font-bold text-lg text-blue-900 dark:text-blue-100">{formatCurrency(data.assets.total)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border-2 border-red-200 dark:border-red-800">
            <h3 className="font-bold text-lg mb-4 text-red-900 dark:text-red-100">LIABILITIES</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">Accounts Payable</span>
                <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(data.liabilities.accountsPayable)}</span>
              </div>
              <div className="border-t border-red-300 dark:border-red-700 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg text-red-900 dark:text-red-100">Total Liabilities</span>
                  <span className="font-bold text-lg text-red-900 dark:text-red-100">{formatCurrency(data.liabilities.total)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border-2 border-green-200 dark:border-green-800">
            <h3 className="font-bold text-lg mb-4 text-green-900 dark:text-green-100">EQUITY</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">Retained Earnings</span>
                <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(data.equity.retainedEarnings)}</span>
              </div>
              <div className="border-t border-green-300 dark:border-green-700 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg text-green-900 dark:text-green-100">Total Equity</span>
                  <span className="font-bold text-lg text-green-900 dark:text-green-100">{formatCurrency(data.equity.total)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {data.balance && (
            <div className={`p-4 rounded-lg ${data.balance.isBalanced ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {data.balance.isBalanced ? (
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  )}
                  <span className={`font-semibold ${data.balance.isBalanced ? 'text-green-900 dark:text-green-100' : 'text-yellow-900 dark:text-yellow-100'}`}>
                    {data.balance.isBalanced ? 'Balance Sheet is Balanced' : 'Balance Sheet is Not Balanced'}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Assets = Liabilities + Equity</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(data.balance.totalAssets)} = {formatCurrency(data.balance.totalLiabilities)} + {formatCurrency(data.balance.totalEquity)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
    
    // Accounts Receivable Aging
    if (data.agingBuckets && data.totals) {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            {Object.entries(data.agingBuckets).map(([bucket, items]: [string, any]) => (
              <div key={bucket} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="font-semibold text-gray-900 dark:text-white mb-2">{bucket} days</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(data.totals[bucket])}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
              </div>
            ))}
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800">
            <p className="font-bold text-lg text-blue-900 dark:text-blue-100">Total Outstanding: {formatCurrency(data.totals.total)}</p>
            {data.summary && (
              <div className="mt-3 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <p>Total Customers: {data.summary.totalCustomers}</p>
                <p>Total Invoices: {data.summary.totalInvoices}</p>
                {data.summary.averageDaysOverdue && (
                  <p>Average Days Overdue: {Math.round(data.summary.averageDaysOverdue)}</p>
                )}
              </div>
            )}
          </div>
          
          {/* Detailed Aging Table */}
          <div className="mt-6">
            <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Aging Details</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {Object.entries(data.agingBuckets).map(([bucket, items]: [string, any]) => {
                if (items.length === 0) return null;
                return (
                  <div key={bucket} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{bucket} Days ({items.length} {items.length === 1 ? 'item' : 'items'})</h4>
                    <div className="space-y-2">
                      {items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-3 rounded">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {item.invoiceNumber || item.description}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {item.customer || item.vendor} • {new Date(item.date || item.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(item.amount)}</p>
                            {item.daysOverdue !== undefined && (
                              <p className="text-xs text-gray-600 dark:text-gray-400">{item.daysOverdue} days overdue</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }
    
    // Cash Flow Statement
    if (data.operating && data.investing && data.financing) {
      return (
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border-2 border-blue-200 dark:border-blue-800">
            <h3 className="font-bold text-lg mb-4 text-blue-900 dark:text-blue-100">OPERATING ACTIVITIES</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">Cash Inflow</span>
                <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(data.operating.inflow)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">Cash Outflow</span>
                <span className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(data.operating.outflow)}</span>
              </div>
              <div className="border-t border-blue-300 dark:border-blue-700 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-bold text-blue-900 dark:text-blue-100">Net Operating Cash</span>
                  <span className={`font-bold ${data.operating.net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(data.operating.net)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg border-2 border-purple-200 dark:border-purple-800">
            <h3 className="font-bold text-lg mb-4 text-purple-900 dark:text-purple-100">INVESTING ACTIVITIES</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">Cash Inflow</span>
                <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(data.investing.inflow)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">Cash Outflow</span>
                <span className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(data.investing.outflow)}</span>
              </div>
              <div className="border-t border-purple-300 dark:border-purple-700 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-bold text-purple-900 dark:text-purple-100">Net Investing Cash</span>
                  <span className={`font-bold ${data.investing.net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(data.investing.net)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-lg border-2 border-indigo-200 dark:border-indigo-800">
            <h3 className="font-bold text-lg mb-4 text-indigo-900 dark:text-indigo-100">FINANCING ACTIVITIES</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">Cash Inflow</span>
                <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(data.financing.inflow)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">Cash Outflow</span>
                <span className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(data.financing.outflow)}</span>
              </div>
              <div className="border-t border-indigo-300 dark:border-indigo-700 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-bold text-indigo-900 dark:text-indigo-100">Net Financing Cash</span>
                  <span className={`font-bold ${data.financing.net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(data.financing.net)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {data.summary && (
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">SUMMARY</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Net Change in Cash</span>
                  <span className={`font-bold text-lg ${data.summary.netChangeInCash >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(data.summary.netChangeInCash)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Beginning Cash</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(data.summary.beginningCash || 0)}</span>
                </div>
                <div className="border-t border-gray-300 dark:border-gray-700 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-900 dark:text-white">Ending Cash</span>
                    <span className="font-bold text-lg text-gray-900 dark:text-white">{formatCurrency(data.summary.endingCash)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
    
    // Trial Balance
    if (data.accounts && data.totals) {
      return (
        <div className="space-y-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left text-gray-900 dark:text-white">Account</th>
                  <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-right text-gray-900 dark:text-white">Debit</th>
                  <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-right text-gray-900 dark:text-white">Credit</th>
                </tr>
              </thead>
              <tbody>
                {data.accounts.map((account: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-gray-900 dark:text-white">{account.account}</td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-right text-gray-900 dark:text-white">
                      {account.debit > 0 ? formatCurrency(account.debit) : '-'}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-right text-gray-900 dark:text-white">
                      {account.credit > 0 ? formatCurrency(account.credit) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 dark:bg-gray-800 font-bold">
                  <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-gray-900 dark:text-white">Totals</td>
                  <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-right text-gray-900 dark:text-white">
                    {formatCurrency(data.totals.debits)}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-right text-gray-900 dark:text-white">
                    {formatCurrency(data.totals.credits)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          {data.totals && (
            <div className={`p-4 rounded-lg ${data.totals.isBalanced ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {data.totals.isBalanced ? (
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  )}
                  <span className={`font-semibold ${data.totals.isBalanced ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}`}>
                    {data.totals.isBalanced ? 'Trial Balance is Balanced' : 'Trial Balance is Not Balanced'}
                  </span>
                </div>
                {!data.totals.isBalanced && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Difference: {formatCurrency(Math.abs(data.totals.difference))}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }
    
    // Tax Summary
    if (data.revenue && data.deductions && data.taxableIncome) {
      return (
        <div className="space-y-6">
          <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border-2 border-green-200 dark:border-green-800">
            <h3 className="font-bold text-lg mb-4 text-green-900 dark:text-green-100">TAXABLE REVENUE</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">Total Revenue</span>
                <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(data.revenue.total)}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{data.revenue.invoiceCount} invoices</p>
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border-2 border-blue-200 dark:border-blue-800">
            <h3 className="font-bold text-lg mb-4 text-blue-900 dark:text-blue-100">TAX DEDUCTIONS</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">Total Deductions</span>
                <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(data.deductions.total)}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{data.deductions.expenseCount} tax-deductible expenses</p>
            </div>
          </div>
          
          <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-lg border-2 border-amber-200 dark:border-amber-800">
            <h3 className="font-bold text-lg mb-4 text-amber-900 dark:text-amber-100">TAXABLE INCOME</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">Net Taxable Income</span>
                <span className="font-semibold text-lg text-gray-900 dark:text-white">{formatCurrency(data.taxableIncome.net)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">Estimated Tax (25%)</span>
                <span className="font-semibold text-lg text-amber-900 dark:text-amber-100">{formatCurrency(data.taxableIncome.estimatedTax)}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Customer/Product/Vendor/Category lists
    if (data.customers || data.products || data.vendors || data.categories) {
      const items = data.customers || data.products || data.vendors || data.categories || [];
      const summary = data.summary;
      
      return (
        <div className="space-y-6">
          {summary && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {summary.totalCustomers !== undefined && (
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400">Total Customers</p>
                    <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{summary.totalCustomers}</p>
                  </div>
                )}
                {summary.totalRevenue !== undefined && (
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400">Total Revenue</p>
                    <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{formatCurrency(summary.totalRevenue)}</p>
                  </div>
                )}
                {summary.averagePerCustomer !== undefined && (
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400">Average per Customer</p>
                    <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{formatCurrency(summary.averagePerCustomer)}</p>
                  </div>
                )}
                {summary.totalExpenses !== undefined && (
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400">Total Expenses</p>
                    <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{formatCurrency(summary.totalExpenses)}</p>
                  </div>
                )}
                {summary.categoryCount !== undefined && (
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400">Categories</p>
                    <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{summary.categoryCount}</p>
                  </div>
                )}
                {summary.topCustomer && (
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400">Top Customer</p>
                    <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{summary.topCustomer.customer}</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">{formatCurrency(summary.topCustomer.total)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {items.map((item: any, index: number) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">{item.customer || item.product || item.vendor || item.category?.replace(/_/g, ' ')}</p>
                  {item.email && <p className="text-sm text-gray-600 dark:text-gray-400">{item.email}</p>}
                  {item.invoiceCount && <p className="text-sm text-gray-600 dark:text-gray-400">{item.invoiceCount} {item.invoiceCount === 1 ? 'invoice' : 'invoices'}</p>}
                  {item.expenseCount && <p className="text-sm text-gray-600 dark:text-gray-400">{item.expenseCount} {item.expenseCount === 1 ? 'expense' : 'expenses'}</p>}
                  {item.quantity && <p className="text-sm text-gray-600 dark:text-gray-400">Quantity: {item.quantity}</p>}
                  {item.count && <p className="text-sm text-gray-600 dark:text-gray-400">{item.count} {item.count === 1 ? 'item' : 'items'}</p>}
                </div>
                <div className="text-right ml-4">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(item.total || item.revenue || 0)}</p>
                  {item.averageInvoice && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">Avg: {formatCurrency(item.averageInvoice)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    // Fallback for any other report format
    return (
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <p className="text-gray-600 dark:text-gray-400 mb-2">Report data:</p>
        <pre className="bg-white dark:bg-gray-900 p-4 rounded border border-gray-200 dark:border-gray-700 overflow-auto text-sm">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header
        onMenuClick={() => {}}
        title="Financial Reports"
        subtitle="Generate and analyze comprehensive business insights with professional reports."
      />

      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Business Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ModernCard className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Revenue</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">J${reportData.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-green-600 dark:text-green-400">{reportData.totalInvoices} invoices</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </ModernCard>

          <ModernCard className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">Total Expenses</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">J${reportData.totalExpenses.toLocaleString()}</p>
                <p className="text-xs text-red-600 dark:text-red-400">Business costs</p>
              </div>
              <CreditCard className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </ModernCard>

          <ModernCard className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Customers</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{reportData.totalCustomers}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">Active clients</p>
              </div>
              <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </ModernCard>

          <ModernCard className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Products</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{reportData.totalProducts}</p>
                <p className="text-xs text-purple-600 dark:text-purple-400">Items & services</p>
              </div>
              <Package className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </ModernCard>
        </div>

        {/* Date Range & Filters */}
        <ModernCard title="Report Parameters" className="dark:bg-gray-800 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="startDate" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                className="mt-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="endDate" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                End Date
              </Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                className="mt-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="asOfDate" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                As Of Date
              </Label>
              <Input
                id="asOfDate"
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
                className="mt-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="accountId" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Account (for General Ledger)
              </Label>
              <select
                id="accountId"
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Account</option>
                {accounts.map(acc => (
                  <option key={acc._id} value={acc._id}>
                    {acc.code} - {acc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </ModernCard>

        {/* Search & Category Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 dark:bg-gray-800 dark:text-white dark:border-gray-700"
              />
            </div>
          </div>
          <div className="w-full md:w-64">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {reportCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report) => {
            const IconComponent = report.icon;
            const isGenerating = generatingReport === report.id;
            return (
              <ModernCard
                key={report.id}
                title={report.name}
                description={report.description}
                className={`${report.bgColor} ${report.borderColor} dark:border-gray-700`}
              >
                <div className="flex items-center justify-center h-20 mb-4">
                  <IconComponent className={`h-12 w-12 ${report.color}`} />
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleGenerateReport(report)}
                    disabled={isGenerating}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <BarChart2 className="mr-2 h-4 w-4" />
                        Generate
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-300">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </ModernCard>
            );
          })}
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && currentReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-6 rounded-t-3xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{currentReport.reportName}</h2>
                {currentReport.period && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {currentReport.period.startDate} to {currentReport.period.endDate}
                  </p>
                )}
                {currentReport.asOfDate && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    As of {new Date(currentReport.asOfDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => setShowReportModal(false)}
                className="dark:border-gray-600 dark:text-gray-300"
              >
                <XCircle className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
              {renderReportContent()}
            </div>
            <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-8 py-4 rounded-b-3xl flex justify-end space-x-2">
              <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
              <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button onClick={() => setShowReportModal(false)} className="bg-blue-600 hover:bg-blue-700 text-white">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
