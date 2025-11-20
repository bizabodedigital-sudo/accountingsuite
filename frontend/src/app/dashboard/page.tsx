'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import DashboardStats from '@/components/DashboardStats';
import DashboardAlerts from '@/components/DashboardAlerts';
import { dashboardAPI } from '@/lib/api';
import { Loader2, TrendingUp, TrendingDown, DollarSign, FileText, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Loading dashboard data...');
      const response = await dashboardAPI.getDashboard();
      console.log('✅ Dashboard data loaded:', response.data);
      setDashboardData(response.data.data);
    } catch (error: any) {
      console.error('❌ Failed to load dashboard:', error);
      setError(error.response?.data?.error || error.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading dashboard: {error}</p>
          <button 
            onClick={loadDashboard}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No dashboard data available</p>
          <button 
            onClick={loadDashboard}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return `J$ ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header 
        onMenuClick={() => {}}
        title="Dashboard"
        subtitle="Overview of your business performance"
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats Cards */}
          <DashboardStats
            totalRevenue={dashboardData.stats.totalRevenue}
            totalExpenses={dashboardData.stats.totalExpenses}
            netIncome={dashboardData.stats.netIncome}
            pendingInvoices={dashboardData.stats.pendingInvoices}
            overdueInvoices={dashboardData.stats.overdueInvoices}
            upcomingPayroll={0}
          />

          {/* Alerts */}
          <DashboardAlerts alerts={dashboardData.alerts || []} />

          {/* Charts and Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <ModernCard title="Revenue Trend (Last 6 Months)">
              <div className="h-64 flex items-end justify-between gap-2">
                {dashboardData.trends.revenue.map((item: any, index: number) => {
                  const maxRevenue = Math.max(...dashboardData.trends.revenue.map((r: any) => r.revenue));
                  const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer"
                           style={{ height: `${height}%`, minHeight: '4px' }}
                           title={`${item.month}: ${formatCurrency(item.revenue)}`}
                      />
                      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 text-center transform -rotate-45 origin-left whitespace-nowrap">
                        {item.month.split(' ')[0]}
                      </div>
                    </div>
                  );
                })}
        </div>
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
                Total: {formatCurrency(dashboardData.trends.revenue.reduce((sum: number, r: any) => sum + r.revenue, 0))}
            </div>
          </ModernCard>

            {/* Expense Trend */}
            <ModernCard title="Expense Trend (Last 6 Months)">
              <div className="h-64 flex items-end justify-between gap-2">
                {dashboardData.trends.expenses.map((item: any, index: number) => {
                  const maxExpense = Math.max(...dashboardData.trends.expenses.map((e: any) => e.expenses));
                  const height = maxExpense > 0 ? (item.expenses / maxExpense) * 100 : 0;
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="w-full bg-red-500 rounded-t hover:bg-red-600 transition-colors cursor-pointer"
                           style={{ height: `${height}%`, minHeight: '4px' }}
                           title={`${item.month}: ${formatCurrency(item.expenses)}`}
                      />
                      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 text-center transform -rotate-45 origin-left whitespace-nowrap">
                        {item.month.split(' ')[0]}
                      </div>
        </div>
                  );
                })}
              </div>
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
                Total: {formatCurrency(dashboardData.trends.expenses.reduce((sum: number, e: any) => sum + e.expenses, 0))}
            </div>
          </ModernCard>
          </div>

          {/* Cash Flow and Top Customers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cash Flow Indicator */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Cash Position
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Current Cash Balance</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(dashboardData.stats.cashBalance)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Outstanding Receivables</p>
                    <p className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                      {formatCurrency(dashboardData.stats.outstandingReceivables)}
                    </p>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Projected Cash Flow</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(dashboardData.stats.cashBalance + dashboardData.stats.outstandingReceivables)}
                    </p>
              </div>
            </div>
              </CardContent>
            </Card>

            {/* Top Customers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Top Customers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData.topCustomers && dashboardData.topCustomers.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.topCustomers.map((customer: any, index: number) => (
                      <div key={customer.customerId} className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            #{index + 1}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {customer.customerName}
                          </span>
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(customer.totalRevenue)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400">No customer data available</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Payments */}
          {dashboardData.recentPayments && dashboardData.recentPayments.length > 0 && (
            <ModernCard title="Recent Payments">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Invoice</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Method</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.recentPayments.map((payment: any) => (
                      <tr key={payment.id} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                          {new Date(payment.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                          {payment.invoiceNumber}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {payment.method}
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-right text-gray-900 dark:text-white">
                          {formatCurrency(payment.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
          </ModernCard>
          )}
        </div>
      </div>
    </div>
  );
}
