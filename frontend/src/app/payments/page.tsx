'use client';

import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, Plus, Search, Filter, CheckCircle, XCircle, Clock, Eye, CreditCard, Banknote } from 'lucide-react';
import { paymentAPI } from '@/lib/api';

export default function PaymentsPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadPayments();
    }
  }, [isAuthenticated, methodFilter]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (methodFilter !== 'all') {
        params.paymentMethod = methodFilter;
      }
      const response = await paymentAPI.getPayments(params);
      setPayments(response.data.data || []);
    } catch (error) {
      console.error('Failed to load payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMethodIcon = (method: string) => {
    const icons: Record<string, any> = {
      CASH: DollarSign,
      CHECK: Banknote,
      CREDIT_CARD: CreditCard,
      DEBIT_CARD: CreditCard,
      STRIPE: CreditCard,
      PAYPAL: CreditCard,
      BANK_TRANSFER: Banknote,
    };
    return icons[method] || DollarSign;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', label: 'Pending' },
      COMPLETED: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', label: 'Completed' },
      FAILED: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', label: 'Failed' },
      REFUNDED: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300', label: 'Refunded' },
      CANCELLED: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', label: 'Cancelled' },
    };
    const config = statusConfig[status] || statusConfig.PENDING;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = !searchTerm || 
      payment.paymentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (typeof payment.invoiceId === 'object' && payment.invoiceId?.number?.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading payments...</p>
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
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        title="Payments"
        subtitle="View and manage payments"
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Actions Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-1 gap-2 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Methods</option>
              <option value="CASH">Cash</option>
              <option value="CHECK">Check</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="STRIPE">Stripe</option>
              <option value="PAYPAL">PayPal</option>
            </select>
          </div>
          <Button
            onClick={() => router.push('/payments/create')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Record Payment
          </Button>
        </div>

        {/* Payments List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading payments...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <ModernCard className="p-12 text-center">
            <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No payments found</h3>
            <p className="text-gray-600 dark:text-gray-400">Payments will appear here once they are recorded</p>
          </ModernCard>
        ) : (
          <div className="grid gap-4">
            {filteredPayments.map((payment) => {
              const MethodIcon = getMethodIcon(payment.paymentMethod);
              return (
                <ModernCard key={payment._id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <MethodIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {payment.paymentNumber || 'PAY-001'}
                        </h3>
                        {getStatusBadge(payment.status)}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                          <span className="font-medium">Invoice:</span>{' '}
                          {typeof payment.invoiceId === 'object' ? payment.invoiceId.number : 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Date:</span>{' '}
                          {new Date(payment.paymentDate).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Method:</span>{' '}
                          {payment.paymentMethod?.replace('_', ' ')}
                        </div>
                        <div>
                          <span className="font-medium">Amount:</span>{' '}
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            ${payment.amount?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                      </div>
                      {payment.isPartial && (
                        <div className="mt-2 text-sm text-orange-600 dark:text-orange-400">
                          Partial payment - Remaining: ${payment.remainingBalance?.toFixed(2) || '0.00'}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/payments/${payment._id}`)}
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </ModernCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

