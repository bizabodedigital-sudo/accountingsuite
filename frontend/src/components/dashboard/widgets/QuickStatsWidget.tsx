'use client';

import Widget from '../Widget';
import { FileText, DollarSign, Receipt, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { invoiceAPI, expenseAPI, customerAPI, paymentAPI } from '@/lib/api';

interface QuickStatsWidgetProps {
  id: string;
  onRemove?: (id: string) => void;
  onSettings?: (id: string) => void;
}

export default function QuickStatsWidget({ 
  id, 
  onRemove, 
  onSettings
}: QuickStatsWidgetProps) {
  const [stats, setStats] = useState({
    invoices: { count: 0, total: 0 },
    payments: { count: 0, total: 0 },
    expenses: { count: 0, total: 0 },
    customers: { count: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      const [invoicesRes, paymentsRes, expensesRes, customersRes] = await Promise.allSettled([
        invoiceAPI.getInvoices({ page: 1, limit: 100, status: 'SENT' }),
        paymentAPI.getPayments({ page: 1, limit: 100 }),
        expenseAPI.getExpenses({ page: 1, limit: 100 }),
        customerAPI.getCustomers({ page: 1, limit: 100 })
      ]);

      const invoices = invoicesRes.status === 'fulfilled' ? invoicesRes.value.data?.data || [] : [];
      const payments = paymentsRes.status === 'fulfilled' ? paymentsRes.value.data?.data || [] : [];
      const expenses = expensesRes.status === 'fulfilled' ? expensesRes.value.data?.data || [] : [];
      const customers = customersRes.status === 'fulfilled' ? customersRes.value.data?.data || [] : [];

      setStats({
        invoices: {
          count: invoices.length,
          total: invoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0)
        },
        payments: {
          count: payments.length,
          total: payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
        },
        expenses: {
          count: expenses.length,
          total: expenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0)
        },
        customers: {
          count: customers.length
        }
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Widget
      id={id}
      title="Quick Stats"
      onRemove={onRemove}
      onSettings={onSettings}
    >
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
            <p className="text-xs text-gray-600 dark:text-gray-400">Invoices</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.invoices.count}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">${stats.invoices.total.toFixed(2)}</p>
          </div>
          
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400 mx-auto mb-1" />
            <p className="text-xs text-gray-600 dark:text-gray-400">Payments</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.payments.count}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">${stats.payments.total.toFixed(2)}</p>
          </div>
          
          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <Receipt className="w-5 h-5 text-red-600 dark:text-red-400 mx-auto mb-1" />
            <p className="text-xs text-gray-600 dark:text-gray-400">Expenses</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.expenses.count}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">${stats.expenses.total.toFixed(2)}</p>
          </div>
          
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <Users className="w-5 h-5 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
            <p className="text-xs text-gray-600 dark:text-gray-400">Customers</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.customers.count}</p>
          </div>
        </div>
      )}
    </Widget>
  );
}

