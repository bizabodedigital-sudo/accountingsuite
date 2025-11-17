'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { invoiceAPI, expenseAPI, reconciliationAPI } from '@/lib/api';
import MatchTransactionModal from '@/components/MatchTransactionModal';
import {
  Search,
  Filter,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  Banknote,
  DollarSign,
  Calendar,
  FileText,
  RefreshCw,
  Eye,
  Check,
  X,
  Link2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  status: 'matched' | 'unmatched' | 'pending';
  bankReference?: string;
  accountReference?: string;
  reference?: string;
  matchedInvoiceId?: any;
  matchedExpenseId?: any;
}

interface ReconciliationSummary {
  bankBalance: number;
  bookBalance: number;
  difference: number;
  matchedTransactions: number;
  unmatchedTransactions: number;
  totalTransactions: number;
}

export default function ReconciliationPage() {
  const { user, tenant, isLoading, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'matched' | 'unmatched' | 'pending'>('all');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year ago
    end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year ahead
  });
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [summary, setSummary] = useState<ReconciliationSummary>({
    bankBalance: 0,
    bookBalance: 0,
    difference: 0,
    matchedTransactions: 0,
    unmatchedTransactions: 0,
    totalTransactions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [matchingTransaction, setMatchingTransaction] = useState<BankTransaction | null>(null);
  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load reconciliation data from APIs
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      loadReconciliationData();
    }
  }, [isLoading, isAuthenticated, dateRange.start, dateRange.end]);

  const loadReconciliationData = async (customDateRange?: { start: string; end: string }) => {
    try {
      const rangeToUse = customDateRange || dateRange;
      console.log('🔄 Loading reconciliation data from APIs...', { dateRange: rangeToUse });
      setLoading(true);
      
      const [invoicesRes, expensesRes, transactionsRes, summaryRes] = await Promise.all([
        invoiceAPI.getInvoices({
          startDate: rangeToUse.start,
          endDate: rangeToUse.end,
        }),
        expenseAPI.getExpenses({
          startDate: rangeToUse.start,
          endDate: rangeToUse.end,
        }),
        reconciliationAPI.getBankTransactions({
          startDate: rangeToUse.start,
          endDate: rangeToUse.end,
          limit: 1000
        }),
        reconciliationAPI.getReconciliationSummary({
          startDate: rangeToUse.start,
          endDate: rangeToUse.end
        })
      ]);

      const invoices = invoicesRes.data.data || [];
      const expenses = expensesRes.data.data || [];
      const bankTransactions = transactionsRes.data.data || [];
      const reconciliationSummary = summaryRes.data.summary || {};
      
      console.log('📊 Loaded data:', {
        invoices: invoices.length,
        expenses: expenses.length,
        bankTransactions: bankTransactions.length,
        dateRange: rangeToUse
      });

      // Calculate book balance from invoices and expenses
      const totalRevenue = invoices.reduce((sum: number, inv: any) => {
        if (inv.status === 'paid' || inv.status === 'sent') {
          return sum + (inv.total || 0);
        }
        return sum;
      }, 0);
      const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);
      const bookBalance = totalRevenue - totalExpenses;

      // Transform bank transactions to match frontend interface
      const transformedTransactions: BankTransaction[] = bankTransactions.map((t: any) => {
        // Handle matchedInvoiceId - could be populated object, ID string, or null
        let matchedInvoice = null;
        if (t.matchedInvoiceId) {
          if (typeof t.matchedInvoiceId === 'object') {
            matchedInvoice = t.matchedInvoiceId; // Already populated object
          } else {
            matchedInvoice = { invoiceNumber: t.matchedInvoiceId }; // ID string, create minimal object
          }
        }

        // Handle matchedExpenseId - could be populated object, ID string, or null
        let matchedExpense = null;
        if (t.matchedExpenseId) {
          if (typeof t.matchedExpenseId === 'object') {
            matchedExpense = t.matchedExpenseId; // Already populated object
          } else {
            matchedExpense = { description: 'Expense' }; // ID string, create minimal object
          }
        }

        return {
          id: t._id,
          date: t.date,
          description: t.description,
          amount: t.amount,
          type: t.type,
          status: t.status,
          bankReference: t.bankReference || '',
          accountReference: t.accountReference || '',
          matchedInvoiceId: matchedInvoice,
          matchedExpenseId: matchedExpense,
        };
      });

      const bankBalance = reconciliationSummary.bankBalance || 0;
      const matchedCount = reconciliationSummary.matchedTransactions || 0;
      const unmatchedCount = reconciliationSummary.unmatchedTransactions || 0;

      setTransactions(transformedTransactions);
      setSummary({
        bankBalance,
        bookBalance,
        difference: bankBalance - bookBalance,
        matchedTransactions: matchedCount,
        unmatchedTransactions: unmatchedCount,
        totalTransactions: transformedTransactions.length
      });

      console.log('✅ Reconciliation data loaded successfully');
    } catch (err) {
      console.error('❌ Failed to load reconciliation data:', err);
      setUploadError('Failed to load reconciliation data. Please try again.');
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

  // Show loading state while checking authentication
  if (isLoading && transactions.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading reconciliation data...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.bankReference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.accountReference?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleMatchTransaction = async (transactionId: string, invoiceId?: string, expenseId?: string) => {
    try {
      await reconciliationAPI.matchTransaction(transactionId, {
        invoiceId,
        expenseId,
      });
      setMatchingTransaction(null);
      await loadReconciliationData();
      setUploadSuccess('Transaction matched successfully!');
      setTimeout(() => setUploadSuccess(''), 3000);
    } catch (err: any) {
      console.error('Failed to match transaction:', err);
      setUploadError(err.response?.data?.error || 'Failed to match transaction. Please try again.');
    }
  };

  const handleUnmatchTransaction = async (transactionId: string) => {
    try {
      await reconciliationAPI.unmatchTransaction(transactionId);
      await loadReconciliationData();
      setUploadSuccess('Transaction unmatched successfully!');
      setTimeout(() => setUploadSuccess(''), 3000);
    } catch (err: any) {
      console.error('Failed to unmatch transaction:', err);
      setUploadError(err.response?.data?.error || 'Failed to unmatch transaction. Please try again.');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/pdf',
      'text/plain',
      'application/x-ofx',
      'application/vnd.intu.qfx',
    ];
    
    const allowedExtensions = ['.csv', '.xls', '.xlsx', '.pdf', '.txt', '.ofx', '.qfx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      setUploadError('Invalid file type. Please upload CSV, Excel, PDF, OFX, or QFX files.');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds 10MB limit.');
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      console.log('📤 Uploading bank statement:', file.name);
      const response = await reconciliationAPI.uploadBankStatement(file);
      
      console.log('✅ File uploaded and parsed successfully:', response.data);
      const transactionsCount = response.data.transactionsCount || 0;
      setUploadSuccess(
        transactionsCount > 0
          ? `Bank statement "${file.name}" uploaded successfully! Imported ${transactionsCount} transactions.`
          : `Bank statement "${file.name}" uploaded successfully!`
      );
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Expand date range to show all transactions (remove date filter temporarily)
      // This ensures newly uploaded transactions are visible regardless of their dates
      const expandedDateRange = {
        start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year ago
        end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year ahead
      };
      setDateRange(expandedDateRange);

      // Reload reconciliation data immediately with expanded date range
      // This ensures newly uploaded transactions are visible
      setTimeout(() => {
        console.log('🔄 Reloading with expanded date range:', expandedDateRange);
        loadReconciliationData(expandedDateRange);
      }, 1500);

    } catch (err: any) {
      console.error('❌ Failed to upload file:', err);
      setUploadError(
        err.response?.data?.error || 
        'Failed to upload bank statement. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleExportReport = async () => {
    try {
      setExporting(true);
      // Create CSV content
      const headers = ['Date', 'Description', 'Amount', 'Type', 'Status', 'Bank Reference', 'Account Reference'];
      const rows = filteredTransactions.map(t => [
        new Date(t.date).toLocaleDateString(),
        t.description,
        t.amount.toString(),
        t.type,
        t.status,
        t.bankReference || '',
        t.accountReference || ''
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reconciliation-report-${dateRange.start}-to-${dateRange.end}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setUploadSuccess('Report exported successfully!');
      setTimeout(() => setUploadSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to export report:', err);
      setUploadError('Failed to export report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleCompleteReconciliation = async () => {
    if (summary.unmatchedTransactions > 0) {
      if (!confirm(`You have ${summary.unmatchedTransactions} unmatched transactions. Are you sure you want to complete reconciliation?`)) {
        return;
      }
    }
    
    setUploadSuccess('Reconciliation completed successfully!');
    setTimeout(() => setUploadSuccess(''), 3000);
    await loadReconciliationData();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'matched':
        return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'unmatched':
        return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'matched':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
      case 'unmatched':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
      default:
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header
        onMenuClick={() => {}}
        title="Bank Reconciliation"
        subtitle="Match your bank transactions with your accounting records to ensure accuracy."
      />

      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Upload Messages */}
        {uploadError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 mr-2" />
              <span>{uploadError}</span>
            </div>
            <button
              onClick={() => setUploadError('')}
              className="text-red-800 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        
        {uploadSuccess && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-200 px-4 py-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span>{uploadSuccess}</span>
            </div>
            <button
              onClick={() => setUploadSuccess('')}
              className="text-green-800 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xls,.xlsx,.pdf,.txt,.ofx,.qfx"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button 
            variant="outline" 
            onClick={handleUploadClick}
            disabled={uploading}
            className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {uploading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" /> Import Bank Statement
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExportReport}
            disabled={exporting || filteredTransactions.length === 0}
            className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {exporting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" /> Export Report
              </>
            )}
          </Button>
          <Button 
            onClick={() => loadReconciliationData()}
            disabled={loading}
            variant="outline"
            className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button
            onClick={handleCompleteReconciliation}
            disabled={summary.difference !== 0 && summary.unmatchedTransactions > 0}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle className="mr-2 h-4 w-4" /> Complete Reconciliation
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ModernCard
            title="Bank Balance"
            description="Current bank statement balance"
            className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  J$ {summary.bankBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">As of statement date</p>
              </div>
              <Banknote className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </ModernCard>

          <ModernCard
            title="Book Balance"
            description="Your accounting records balance"
            className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  J$ {summary.bookBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">From your books</p>
              </div>
              <FileText className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </ModernCard>

          <ModernCard
            title="Difference"
            description="Variance between bank and books"
            className={`${
              summary.difference === 0
                ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800'
                : 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  {summary.difference !== 0 && (
                    summary.difference > 0 ? (
                      <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    )
                  )}
                  <p
                    className={`text-2xl font-bold ${
                      summary.difference === 0 ? 'text-green-900 dark:text-green-100' : 'text-orange-900 dark:text-orange-100'
                    }`}
                  >
                    J$ {Math.abs(summary.difference).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <p
                  className={`text-sm ${
                    summary.difference === 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
                  }`}
                >
                  {summary.difference === 0 ? 'Balanced! ✓' : 'Needs attention'}
                </p>
              </div>
              <DollarSign
                className={`h-8 w-8 ${
                  summary.difference === 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
                }`}
              />
            </div>
          </ModernCard>

          <ModernCard
            title="Matched Transactions"
            description="Successfully reconciled items"
            className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {summary.matchedTransactions}/{summary.totalTransactions}
                </p>
                <p className="text-sm text-purple-600 dark:text-purple-400">
                  {summary.totalTransactions > 0
                    ? `${Math.round(
                        (summary.matchedTransactions / summary.totalTransactions) * 100
                      )}% complete`
                    : 'No transactions'}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </ModernCard>
        </div>

        {/* Filters and Search */}
        <ModernCard title="Filter Transactions" className="dark:bg-gray-800 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Search Transactions
              </Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by description or reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Status
              </Label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="matched">Matched</option>
                <option value="unmatched">Unmatched</option>
              </select>
            </div>

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
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              onClick={() => {
                const resetDateRange = {
                  start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                };
                setDateRange(resetDateRange);
                setSearchTerm('');
                setStatusFilter('all');
                // Reload with reset date range
                loadReconciliationData(resetDateRange);
              }}
              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Reset Filters
            </Button>
          </div>
        </ModernCard>

        {/* Transactions Table */}
        <ModernCard title="Bank Transactions" className="dark:bg-gray-800 dark:border-gray-700">
          {loading && transactions.length === 0 ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading transactions...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="dark:border-gray-700">
                      <TableHead className="dark:text-gray-300">Date</TableHead>
                      <TableHead className="dark:text-gray-300">Description</TableHead>
                      <TableHead className="dark:text-gray-300">Amount</TableHead>
                      <TableHead className="dark:text-gray-300">Type</TableHead>
                      <TableHead className="dark:text-gray-300">Status</TableHead>
                      <TableHead className="dark:text-gray-300">Bank Ref</TableHead>
                      <TableHead className="dark:text-gray-300">Matched To</TableHead>
                      <TableHead className="text-right dark:text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id} className="dark:border-gray-700 dark:hover:bg-gray-700/50">
                        <TableCell className="dark:text-gray-300">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>{new Date(transaction.date).toLocaleDateString()}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium dark:text-gray-200">
                          <div className="max-w-md">
                            <span className="block truncate" title={transaction.description}>
                              {transaction.description || 'No description'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`font-semibold ${
                              transaction.type === 'credit' 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {transaction.type === 'credit' ? '+' : '-'}J$ {transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              transaction.type === 'credit'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                            }`}
                          >
                            {transaction.type.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(transaction.status)}
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                transaction.status
                              )}`}
                            >
                              {transaction.status.toUpperCase()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm dark:text-gray-300">
                          {transaction.bankReference || 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm dark:text-gray-300">
                          {transaction.matchedInvoiceId ? (
                            <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                              <Link2 className="h-3 w-3" />
                              <span>
                                Invoice #{
                                  typeof transaction.matchedInvoiceId === 'object' 
                                    ? (transaction.matchedInvoiceId.invoiceNumber || transaction.matchedInvoiceId.id || transaction.matchedInvoiceId._id || 'N/A')
                                    : transaction.matchedInvoiceId
                                }
                              </span>
                            </div>
                          ) : transaction.matchedExpenseId ? (
                            <div className="flex items-center space-x-1 text-purple-600 dark:text-purple-400">
                              <Link2 className="h-3 w-3" />
                              <span>
                                Expense {
                                  typeof transaction.matchedExpenseId === 'object'
                                    ? (transaction.matchedExpenseId.description || transaction.matchedExpenseId.id || transaction.matchedExpenseId._id || '')
                                    : transaction.matchedExpenseId
                                }
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            {transaction.status !== 'matched' ? (
                              <Button
                                size="sm"
                                onClick={() => setMatchingTransaction(transaction)}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                title="Match transaction"
                              >
                                <Link2 className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUnmatchTransaction(transaction.id)}
                                className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                title="Unmatch transaction"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredTransactions.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Banknote className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p className="text-lg font-medium">No transactions found</p>
                  <p className="text-sm mt-2">
                    {transactions.length === 0
                      ? 'Try importing a bank statement to get started.'
                      : 'Try adjusting your search criteria or filters.'}
                  </p>
                </div>
              )}
            </>
          )}
        </ModernCard>

        {/* Reconciliation Actions */}
        <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredTransactions.length} of {transactions.length} transactions
            {statusFilter !== 'all' && ` (${statusFilter})`}
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleExportReport}
              disabled={exporting || filteredTransactions.length === 0}
              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </div>
      </div>

      {/* Match Transaction Modal */}
      {matchingTransaction && (
        <MatchTransactionModal
          transaction={matchingTransaction}
          onClose={() => setMatchingTransaction(null)}
          onMatch={(invoiceId, expenseId) => 
            handleMatchTransaction(matchingTransaction.id, invoiceId, expenseId)
          }
        />
      )}
    </div>
  );
}
