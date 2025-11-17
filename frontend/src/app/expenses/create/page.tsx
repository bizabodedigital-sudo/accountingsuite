'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Header from '@/components/Header';
import { expenseAPI, customerAPI } from '@/lib/api';
import {
  ArrowLeft,
  Save,
  Receipt,
  Calendar,
  DollarSign,
  Tag,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  Building,
} from 'lucide-react';

interface Expense {
  _id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  vendorId?: string;
  isReimbursable: boolean;
  isTaxDeductible: boolean;
  notes?: string;
}

export default function CreateExpensePage() {
  const router = useRouter();
  const { user, tenant, isLoading, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'OFFICE_SUPPLIES',
    date: new Date().toISOString().split('T')[0],
    vendorId: '',
    isReimbursable: false,
    isTaxDeductible: true,
    notes: '',
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/login';
    }
  }, [isLoading, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadCustomers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

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
      console.log('💾 Creating expense:', formData);
      
      const response = await expenseAPI.createExpense({
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        category: formData.category,
        vendorId: formData.vendorId,
        date: formData.date,
        isReimbursable: formData.isReimbursable,
        isTaxDeductible: formData.isTaxDeductible,
        notes: formData.notes.trim(),
      });
      
      console.log('✅ Expense created:', response.data);
      
      setSuccess('Expense created successfully!');
      
      // Redirect to expenses page after a brief delay
      setTimeout(() => {
        router.push('/expenses');
      }, 1500);
      
    } catch (err: any) {
      console.error('❌ Error creating expense:', err);
      setError(err.response?.data?.error || 'Failed to create expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
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

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header 
        onMenuClick={() => {}}
        title="Create Expense"
        showSearch={false}
      />
      
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="h-8 w-px bg-gray-300 dark:bg-gray-700" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Expense</h1>
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                Add a new business expense to track your spending
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Status Messages */}
          {error && (
            <Alert variant="destructive" className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
              <XCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800 dark:text-red-200 font-medium">{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
              <CheckCircle className="h-4 w-4" />
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
              <CardDescription className="text-gray-600 dark:text-gray-400">Basic information about the expense</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Description *
                </Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter expense description"
                  className="h-11 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-blue-500/30 transition-all duration-300 font-medium"
                  required
                />
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
                  <Label htmlFor="category" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Category *
                  </Label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="pl-10 w-full h-11 px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-blue-500 focus:ring-blue-500/30 transition-all duration-300 font-medium"
                      required
                    >
                      {categories.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        className="pl-10 w-full h-11 px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-blue-500 focus:ring-blue-500/30 transition-all duration-300 font-medium"
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
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card className="border-gray-200 dark:border-gray-700 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-lg text-gray-900 dark:text-white">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span>Additional Information</span>
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">Optional details and flags</CardDescription>
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
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="isReimbursable"
                      checked={formData.isReimbursable}
                      onChange={(e) => handleInputChange('isReimbursable', e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded focus:ring-blue-500"
                    />
                    <Label htmlFor="isReimbursable" className="text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                      Reimbursable Expense
                    </Label>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 ml-7">
                    This expense can be reimbursed by clients or partners
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="isTaxDeductible"
                      checked={formData.isTaxDeductible}
                      onChange={(e) => handleInputChange('isTaxDeductible', e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded focus:ring-blue-500"
                    />
                    <Label htmlFor="isTaxDeductible" className="text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                      Tax Deductible
                    </Label>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 ml-7">
                    This expense can be deducted from taxable income
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
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
                  <span>Creating...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>Create Expense</span>
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


