'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, FileText, AlertCircle, Clock } from 'lucide-react';

interface DashboardStatsProps {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  pendingInvoices: number;
  overdueInvoices: number;
  upcomingPayroll: number;
}

export default function DashboardStats({
  totalRevenue,
  totalExpenses,
  netIncome,
  pendingInvoices,
  overdueInvoices,
  upcomingPayroll
}: DashboardStatsProps) {
  const formatCurrency = (amount: number) => {
    return `J$ ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Total Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(totalRevenue)}
            </div>
            <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Total Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(totalExpenses)}
            </div>
            <TrendingDown className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Net Income
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(netIncome)}
            </div>
            {netIncome >= 0 ? (
              <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
            ) : (
              <TrendingDown className="w-8 h-8 text-red-600 dark:text-red-400" />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Pending Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {pendingInvoices}
            </div>
            <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}




