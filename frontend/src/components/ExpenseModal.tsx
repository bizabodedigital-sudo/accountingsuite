'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  X,
  Receipt,
  DollarSign,
  Calendar,
  Building,
  FileText,
  Save,
  Loader2,
} from 'lucide-react';
import { customerAPI } from '@/lib/api';

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
  createdAt?: string;
  updatedAt?: string;
}

interface Customer {
  _id: string;
  name: string;
  email?: string;
}

interface ExpenseModalProps {
  expense?: Expense | null;
  onClose: () => void;
  onSave: (expenseData: Partial<Expense>) => void;
}

const EXPENSE_CATEGORIES = [
  { value: 'OFFICE_SUPPLIES', label: 'Office Supplies' },
  { value: 'UTILITIES', label: 'Utilities' },
  { value: 'RENT', label: 'Rent' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'TRAVEL', label: 'Travel' },
  { value: 'MEALS', label: 'Meals' },
  { value: 'EQUIPMENT', label: 'Equipment' },
  { value: 'PROFESSIONAL_SERVICES', label: 'Professional Services' },
  { value: 'OTHER', label: 'Other' },
];

export default function ExpenseModal({ expense, onClose, onSave }: ExpenseModalProps) {
  const [formData, setFormData] = useState({
    description: expense?.description || '',
    amount: expense?.amount?.toString() || '',
    category: expense?.category || 'OFFICE_SUPPLIES',
    vendorId: typeof expense?.vendorId === 'object' 
      ? expense.vendorId._id 
      : expense?.vendorId || '',
    date: expense?.date 
      ? new Date(expense.date).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0],
    isReimbursable: expense?.isReimbursable || false,
    isTaxDeductible: expense?.isTaxDeductible ?? true,
    notes: expense?.notes || '',
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    
    // Cleanup: restore body scroll when modal closes
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const loadCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const response = await customerAPI.getCustomers();
      setCustomers(response.data.data || []);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.description.trim()) {
      setError('Expense description is required');
      return false;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount greater than 0');
      return false;
    }
    if (!formData.vendorId) {
      setError('Please select a vendor');
      return false;
    }
    if (!formData.date) {
      setError('Expense date is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const expenseData = {
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        category: formData.category,
        vendorId: formData.vendorId,
        date: formData.date,
        isReimbursable: formData.isReimbursable,
        isTaxDeductible: formData.isTaxDeductible,
        notes: formData.notes.trim(),
      };
      
      console.log('💾 Saving expense data:', expenseData);
      onSave(expenseData);
      
      setSuccess(expense ? 'Expense updated successfully!' : 'Expense added successfully!');
      
      // Close modal after a brief delay
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (err: any) {
      console.error('❌ Error saving expense:', err);
      setError('Failed to save expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-hidden">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Receipt className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {expense ? 'Edit Expense' : 'Add New Expense'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  {expense ? 'Update expense information' : 'Record a new business expense'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl p-2"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Form - Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Status Messages */}
          {error && (
            <Alert variant="destructive" className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
              <AlertDescription className="text-red-800 dark:text-red-200 font-medium">{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
              <AlertDescription className="text-green-800 dark:text-green-200 font-medium">{success}</AlertDescription>
            </Alert>
          )}

          {/* Basic Information */}
          <Card className="border-gray-200 dark:border-gray-700 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-lg text-gray-900 dark:text-white">
                <Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span>Expense Details</span>
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">Essential expense information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Description *
                </Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter expense description"
                    className="pl-10 h-11 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-blue-500/30 transition-all duration-300 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Amount (JMD) *
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.amount}
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                      className="pl-10 h-11 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-blue-500/30 transition-all duration-300 font-medium"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Date *
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      className="pl-10 h-11 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-blue-500/30 transition-all duration-300 font-medium"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Category *
                  </Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full h-11 px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-blue-500 focus:ring-blue-500/30 transition-all duration-300 font-medium"
                  >
                    {EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="vendorId" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Vendor *
                  </Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    {loadingCustomers ? (
                      <div className="pl-10 h-11 flex items-center text-gray-500 dark:text-gray-400">
                        Loading vendors...
                      </div>
                    ) : (
                      <select
                        id="vendorId"
                        value={formData.vendorId}
                        onChange={(e) => handleInputChange('vendorId', e.target.value)}
                        className="w-full pl-10 h-11 px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-blue-500 focus:ring-blue-500/30 transition-all duration-300 font-medium"
                        required
                      >
                        <option value="">Select a vendor...</option>
                        {customers.map((customer) => (
                          <option key={customer._id} value={customer._id}>
                            {customer.name} {customer.email ? `(${customer.email})` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card className="border-gray-200 dark:border-gray-700 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-lg text-gray-900 dark:text-white">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span>Additional Information</span>
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">Optional expense details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Notes
                </Label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Additional notes about this expense..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-blue-500 focus:ring-blue-500/30 transition-all duration-300 font-medium resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isReimbursable"
                    checked={formData.isReimbursable}
                    onChange={(e) => handleInputChange('isReimbursable', e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <Label htmlFor="isReimbursable" className="text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                    Reimbursable
                  </Label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isTaxDeductible"
                    checked={formData.isTaxDeductible}
                    onChange={(e) => handleInputChange('isTaxDeductible', e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <Label htmlFor="isTaxDeductible" className="text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                    Tax Deductible
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-8 py-3 font-semibold border-gray-200 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="px-8 py-3 font-semibold bg-gradient-to-r from-blue-600 to-cyan-700 hover:from-blue-700 hover:to-cyan-800 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>{expense ? 'Update Expense' : 'Add Expense'}</span>
                </div>
              )}
            </Button>
          </div>
          </form>
        </div>
      </div>
    </div>
  );
}

