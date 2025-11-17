'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { invoiceAPI, expenseAPI } from '@/lib/api';
import {
  X,
  FileText,
  Receipt,
  DollarSign,
  Calendar,
  Search,
  CheckCircle,
  Loader2,
} from 'lucide-react';

interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
}

interface Invoice {
  _id: string;
  invoiceNumber?: string;
  customerId?: {
    name?: string;
  };
  total: number;
  issueDate: string;
  status: string;
}

interface Expense {
  _id: string;
  description?: string;
  amount: number;
  date: string;
  vendorId?: {
    name?: string;
  };
}

interface MatchTransactionModalProps {
  transaction: BankTransaction;
  onClose: () => void;
  onMatch: (invoiceId?: string, expenseId?: string) => void;
}

export default function MatchTransactionModal({
  transaction,
  onClose,
  onMatch,
}: MatchTransactionModalProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [selectedExpenseId, setSelectedExpenseId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showingAllItems, setShowingAllItems] = useState(false);

  useEffect(() => {
    loadSuggestions();
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const [invoicesRes, expensesRes] = await Promise.all([
        invoiceAPI.getInvoices(),
        expenseAPI.getExpenses(),
      ]);

      const allInvoices = invoicesRes.data.data || [];
      const allExpenses = expensesRes.data.data || [];

      // Filter by amount and date proximity (within 30 days)
      const transactionDate = new Date(transaction.date);
      const thirtyDaysAgo = new Date(transactionDate);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAhead = new Date(transactionDate);
      thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30);

      // Find matching invoices (for credits) or expenses (for debits)
      // Also show close matches (within 5% amount difference)
      if (transaction.type === 'credit') {
        const matchingInvoices = allInvoices.filter((inv: Invoice) => {
          const invDate = new Date(inv.issueDate);
          const amountDiff = Math.abs(inv.total - transaction.amount);
          const amountMatch = amountDiff < 0.01 || (amountDiff / transaction.amount) < 0.05; // Exact or within 5%
          const dateMatch = invDate >= thirtyDaysAgo && invDate <= thirtyDaysAhead;
          return amountMatch && dateMatch;
        }).sort((a: Invoice, b: Invoice) => {
          // Sort by closest amount match first
          const diffA = Math.abs(a.total - transaction.amount);
          const diffB = Math.abs(b.total - transaction.amount);
          return diffA - diffB;
        });
        
        // If no matches found, show all invoices sorted by date (most recent first)
        if (matchingInvoices.length === 0) {
          const allSorted = [...allInvoices].sort((a: Invoice, b: Invoice) => {
            return new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime();
          });
          setInvoices(allSorted.slice(0, 50)); // Limit to 50 most recent
          setShowingAllItems(true);
        } else {
          setInvoices(matchingInvoices);
          setShowingAllItems(false);
        }
      } else {
        const matchingExpenses = allExpenses.filter((exp: Expense) => {
          const expDate = new Date(exp.date);
          const amountDiff = Math.abs(exp.amount - transaction.amount);
          const amountMatch = amountDiff < 0.01 || (amountDiff / transaction.amount) < 0.05; // Exact or within 5%
          const dateMatch = expDate >= thirtyDaysAgo && expDate <= thirtyDaysAhead;
          return amountMatch && dateMatch;
        }).sort((a: Expense, b: Expense) => {
          // Sort by closest amount match first
          const diffA = Math.abs(a.amount - transaction.amount);
          const diffB = Math.abs(b.amount - transaction.amount);
          return diffA - diffB;
        });
        
        // If no matches found, show all expenses sorted by date (most recent first)
        if (matchingExpenses.length === 0) {
          const allSorted = [...allExpenses].sort((a: Expense, b: Expense) => {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          });
          setExpenses(allSorted.slice(0, 50)); // Limit to 50 most recent
          setShowingAllItems(true);
        } else {
          setExpenses(matchingExpenses);
          setShowingAllItems(false);
        }
      }
    } catch (err) {
      console.error('Failed to load suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMatch = () => {
    onMatch(selectedInvoiceId || undefined, selectedExpenseId || undefined);
  };

  const filteredInvoices = invoices.filter(
    (inv) =>
      (inv.invoiceNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (inv.customerId?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const filteredExpenses = expenses.filter(
    (exp) =>
      (exp.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (exp.vendorId?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-hidden">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Match Transaction
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Select an invoice or expense to match with this bank transaction
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* Transaction Info */}
          <Card className="mb-6 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900 dark:text-white">
                Bank Transaction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600 dark:text-gray-400">Description</Label>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {transaction.description}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600 dark:text-gray-400">Amount</Label>
                  <p
                    className={`font-bold ${
                      transaction.type === 'credit'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {transaction.type === 'credit' ? '+' : '-'}J${' '}
                    {transaction.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600 dark:text-gray-400">Date</Label>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {new Date(transaction.date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600 dark:text-gray-400">Type</Label>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {transaction.type.toUpperCase()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search */}
          <div className="mb-6">
            <Label htmlFor="search" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Search
            </Label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Search by invoice number, customer, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              {/* Invoices (for credits) */}
              {transaction.type === 'credit' && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-blue-600" />
                    {showingAllItems ? 'All Invoices' : 'Matching Invoices'}
                  </h3>
                  {showingAllItems && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      No automatic matches found. Showing all invoices for manual selection.
                    </p>
                  )}
                  {filteredInvoices.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {filteredInvoices.map((invoice) => (
                        <Card
                          key={invoice._id}
                          className={`cursor-pointer transition-all border-2 ${
                            selectedInvoiceId === invoice._id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                          }`}
                          onClick={() => {
                            setSelectedInvoiceId(invoice._id);
                            setSelectedExpenseId('');
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <p className="font-semibold text-gray-900 dark:text-white">
                                    {invoice.invoiceNumber || 'N/A'}
                                  </p>
                                  {selectedInvoiceId === invoice._id && (
                                    <CheckCircle className="h-5 w-5 text-blue-600" />
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {invoice.customerId?.name || 'Unknown Customer'}
                                </p>
                                <div className="flex items-center space-x-4 mt-2 text-sm">
                                  <span className="text-gray-600 dark:text-gray-400 flex items-center">
                                    <DollarSign className="h-4 w-4 mr-1" />
                                    J${invoice.total.toLocaleString()}
                                  </span>
                                  <span className="text-gray-600 dark:text-gray-400 flex items-center">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    {new Date(invoice.issueDate).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                      No matching invoices found. You can still match without selecting one.
                    </p>
                  )}
                </div>
              )}

              {/* Expenses (for debits) */}
              {transaction.type === 'debit' && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                    <Receipt className="h-5 w-5 mr-2 text-red-600" />
                    {showingAllItems ? 'All Expenses' : 'Matching Expenses'}
                  </h3>
                  {showingAllItems && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      No automatic matches found. Showing all expenses for manual selection.
                    </p>
                  )}
                  {filteredExpenses.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {filteredExpenses.map((expense) => (
                        <Card
                          key={expense._id}
                          className={`cursor-pointer transition-all border-2 ${
                            selectedExpenseId === expense._id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                          }`}
                          onClick={() => {
                            setSelectedExpenseId(expense._id);
                            setSelectedInvoiceId('');
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <p className="font-semibold text-gray-900 dark:text-white">
                                    {expense.description || 'N/A'}
                                  </p>
                                  {selectedExpenseId === expense._id && (
                                    <CheckCircle className="h-5 w-5 text-blue-600" />
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {expense.vendorId?.name || 'Unknown Vendor'}
                                </p>
                                <div className="flex items-center space-x-4 mt-2 text-sm">
                                  <span className="text-gray-600 dark:text-gray-400 flex items-center">
                                    <DollarSign className="h-4 w-4 mr-1" />
                                    J${expense.amount.toLocaleString()}
                                  </span>
                                  <span className="text-gray-600 dark:text-gray-400 flex items-center">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    {new Date(expense.date).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                      No matching expenses found. You can still match without selecting one.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-8 py-6 rounded-b-3xl">
          <div className="flex items-center justify-end space-x-4">
            <Button variant="outline" onClick={onClose} className="dark:border-gray-600 dark:text-gray-300">
              Cancel
            </Button>
            <Button
              onClick={handleMatch}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Match Transaction
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

