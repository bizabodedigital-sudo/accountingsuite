'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModernCard, StatCard } from '@/components/ui/modern-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Header from '@/components/Header';
import { 
  Receipt, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Repeat,
  Calendar,
  Edit,
  Trash2,
} from 'lucide-react';
import { expenseAPI } from '@/lib/api';
import ExpenseModal from '@/components/ExpenseModal';

interface Expense {
  _id: string;
  description: string;
  amount: number;
  category: string;
  vendorId: string | { _id: string; name: string; email?: string };
  date: string;
  isReimbursable: boolean;
  isTaxDeductible: boolean;
  notes?: string;
  createdAt: string;
}

export default function ExpensesPage() {
  const { user, tenant, isLoading, isAuthenticated } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Load expenses from API
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      loadExpenses();
    }
  }, [isLoading, isAuthenticated]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔄 Loading expenses from API...');
      const response = await expenseAPI.getExpenses({ page: 1, limit: 100 });
      console.log('✅ Expenses API response:', response);
      setExpenses(response.data.data || []);
      console.log('✅ Expenses loaded from API:', response.data.data?.length || 0);
    } catch (err: any) {
      console.error('❌ Failed to load expenses:', err);
      setError(err.response?.data?.error || 'Failed to load expenses');
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (expenseData: Partial<Expense>) => {
    try {
      console.log('➕ Adding new expense:', expenseData);
      setError('');
      
      const response = await expenseAPI.createExpense({
        description: expenseData.description,
        amount: expenseData.amount,
        category: expenseData.category,
        vendorId: expenseData.vendorId,
        date: expenseData.date,
        isReimbursable: expenseData.isReimbursable,
        isTaxDeductible: expenseData.isTaxDeductible,
        notes: expenseData.notes,
      });
      
      console.log('✅ Expense created:', response.data);
      
      // Reload expenses to get updated list
      await loadExpenses();
      setShowAddModal(false);
    } catch (err: any) {
      console.error('❌ Failed to create expense:', err);
      setError(err.response?.data?.error || 'Failed to create expense');
    }
  };

  const handleEditExpense = async (expenseData: Partial<Expense>) => {
    if (!editingExpense) return;
    
    try {
      console.log('✏️ Updating expense:', expenseData);
      setError('');
      
      const response = await expenseAPI.updateExpense(editingExpense._id, {
        description: expenseData.description,
        amount: expenseData.amount,
        category: expenseData.category,
        vendorId: expenseData.vendorId,
        date: expenseData.date,
        isReimbursable: expenseData.isReimbursable,
        isTaxDeductible: expenseData.isTaxDeductible,
        notes: expenseData.notes,
      });
      
      console.log('✅ Expense updated:', response.data);
      
      // Reload expenses to get updated list
      await loadExpenses();
      setEditingExpense(null);
    } catch (err: any) {
      console.error('❌ Failed to update expense:', err);
      setError(err.response?.data?.error || 'Failed to update expense');
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
      return;
    }
    
    try {
      console.log('🗑️ Deleting expense:', expenseId);
      setError('');
      
      await expenseAPI.deleteExpense(expenseId);
      
      console.log('✅ Expense deleted');
      
      // Reload expenses to get updated list
      await loadExpenses();
    } catch (err: any) {
      console.error('❌ Failed to delete expense:', err);
      setError(err.response?.data?.error || 'Failed to delete expense');
    }
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/login';
    }
  }, [isLoading, isAuthenticated]);

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

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      'OFFICE_SUPPLIES': 'Office Supplies',
      'UTILITIES': 'Utilities',
      'RENT': 'Rent',
      'INSURANCE': 'Insurance',
      'MARKETING': 'Marketing',
      'TRAVEL': 'Travel',
      'MEALS': 'Meals',
      'EQUIPMENT': 'Equipment',
      'PROFESSIONAL_SERVICES': 'Professional Services',
      'OTHER': 'Other',
    };
    return labels[category] || category;
  };

  const getVendorName = (vendorId: string | { _id: string; name: string; email?: string }) => {
    if (typeof vendorId === 'object' && vendorId.name) {
      return vendorId.name;
    }
    return 'Unknown Vendor';
  };

  const filteredExpenses = expenses.filter(expense =>
    expense.description.toLowerCase().includes(search.toLowerCase()) ||
    getCategoryLabel(expense.category).toLowerCase().includes(search.toLowerCase()) ||
    getVendorName(expense.vendorId).toLowerCase().includes(search.toLowerCase())
  );

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const reimbursableExpenses = expenses.filter(e => e.isReimbursable).reduce((sum, e) => sum + e.amount, 0);
  const taxDeductibleExpenses = expenses.filter(e => e.isTaxDeductible).reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header 
        onMenuClick={() => {}}
        title="Expense Management"
        subtitle="Track and manage your business expenses"
        showSearch={false}
      />

      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg">
            {error}
            <button 
              onClick={() => setError('')}
              className="ml-2 text-red-800 dark:text-red-300 underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        )}
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Expenses"
            value={`J$${totalExpenses.toLocaleString()}`}
            change={`${expenses.length} transactions`}
            changeType="neutral"
            icon={<Receipt className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
            className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800"
          />
          
          <StatCard
            title="Reimbursable"
            value={`J$${reimbursableExpenses.toLocaleString()}`}
            change="Can be reimbursed"
            changeType="positive"
            icon={<Repeat className="w-6 h-6 text-green-600 dark:text-green-400" />}
            className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800"
          />
          
          <StatCard
            title="Tax Deductible"
            value={`J$${taxDeductibleExpenses.toLocaleString()}`}
            change="Tax benefits"
            changeType="positive"
            icon={<Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />}
            className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800"
          />
          
          <StatCard
            title="This Month"
            value={`J$${expenses.filter(e => new Date(e.date).getMonth() === new Date().getMonth()).reduce((sum, e) => sum + e.amount, 0).toLocaleString()}`}
            change="Current month"
            changeType="neutral"
            icon={<Calendar className="w-6 h-6 text-orange-600 dark:text-orange-400" />}
            className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800"
          />
        </div>

        {/* Search and Filters */}
        <ModernCard>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                <Input
                  placeholder="Search expenses..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
            </div>
          </div>
        </ModernCard>

        {/* Expenses Table */}
        <ModernCard title="Recent Expenses" description={`${filteredExpenses.length} expenses found`}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading expenses...</p>
              </div>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Receipt className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 font-medium mb-2">No expenses found</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mb-4">
                {search ? 'Try adjusting your search terms' : 'Get started by adding your first expense'}
              </p>
              {!search && (
                <Button onClick={() => setShowAddModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Expense
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense._id}>
                      <TableCell className="font-medium dark:text-gray-200">{expense.description}</TableCell>
                      <TableCell className="dark:text-gray-300">{getVendorName(expense.vendorId)}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                          {getCategoryLabel(expense.category)}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold dark:text-gray-200">J${expense.amount.toLocaleString()}</TableCell>
                      <TableCell className="dark:text-gray-300">{new Date(expense.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          {expense.isReimbursable && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                              Reimbursable
                            </span>
                          )}
                          {expense.isTaxDeductible && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                              Tax Deductible
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setEditingExpense(expense)}
                            className="dark:hover:bg-gray-800"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteExpense(expense._id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </ModernCard>
      </div>

      {/* Expense Modal */}
      {showAddModal && (
        <ExpenseModal
          expense={null}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddExpense}
        />
      )}

      {editingExpense && (
        <ExpenseModal
          expense={editingExpense}
          onClose={() => setEditingExpense(null)}
          onSave={handleEditExpense}
        />
      )}
    </div>
  );
}
