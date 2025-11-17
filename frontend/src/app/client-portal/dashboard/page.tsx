'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { clientPortalAPI } from '@/lib/api';
import { useTheme } from 'next-themes';
import {
  FileText,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  LogOut,
  Loader2,
  Moon,
  Sun,
} from 'lucide-react';

export default function ClientPortalDashboard() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clientUser, setClientUser] = useState<any>(null);

  useEffect(() => {
    // Check if client is logged in
    const token = localStorage.getItem('clientToken');
    const userStr = localStorage.getItem('clientUser');
    
    if (!token || !userStr) {
      router.push('/client-portal/login');
      return;
    }

    setClientUser(JSON.parse(userStr));
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await clientPortalAPI.getDashboard();
      setDashboardData(response.data.data);
    } catch (error: any) {
      if (error.response?.status === 401) {
        localStorage.removeItem('clientToken');
        localStorage.removeItem('clientUser');
        router.push('/client-portal/login');
      } else {
        console.error('Failed to load dashboard:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('clientToken');
    localStorage.removeItem('clientUser');
    router.push('/client-portal/login');
  };

  const formatCurrency = (amount: number) => {
    return `J$ ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Client Portal</h1>
              {clientUser?.customer && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Welcome, {clientUser.customer.name || clientUser.customer.email}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Invoices</CardDescription>
              <CardTitle className="text-3xl">{dashboardData.invoices.total}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <FileText className="w-4 h-4 mr-2" />
                {dashboardData.invoices.paid} paid, {dashboardData.invoices.pending} pending
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Amount Owed</CardDescription>
              <CardTitle className="text-3xl text-red-600 dark:text-red-400">
                {formatCurrency(dashboardData.amounts.totalOwed)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <AlertCircle className="w-4 h-4 mr-2" />
                {dashboardData.invoices.overdue} overdue
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Paid</CardDescription>
              <CardTitle className="text-3xl text-green-600 dark:text-green-400">
                {formatCurrency(dashboardData.amounts.totalPaid)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <CheckCircle className="w-4 h-4 mr-2" />
                {dashboardData.invoices.paid} invoices
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Active Quotes</CardDescription>
              <CardTitle className="text-3xl">{dashboardData.quotes.active}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <TrendingUp className="w-4 h-4 mr-2" />
                {dashboardData.quotes.total} total quotes
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>View and manage your invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Pending</span>
                  <span className="font-semibold">{dashboardData.invoices.pending}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Overdue</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    {dashboardData.invoices.overdue}
                  </span>
                </div>
                <Button
                  onClick={() => router.push('/client-portal/invoices')}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  View All Invoices
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quotes</CardTitle>
              <CardDescription>View your quotes and estimates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Active Quotes</span>
                  <span className="font-semibold">{dashboardData.quotes.active}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Quotes</span>
                  <span className="font-semibold">{dashboardData.quotes.total}</span>
                </div>
                <Button
                  onClick={() => router.push('/client-portal/quotes')}
                  variant="outline"
                  className="w-full"
                >
                  View All Quotes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
