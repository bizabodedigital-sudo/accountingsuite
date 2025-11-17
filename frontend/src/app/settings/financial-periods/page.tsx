'use client';

import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Lock, 
  Unlock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCw
} from 'lucide-react';
import { financialPeriodAPI } from '@/lib/api';

interface FinancialPeriod {
  _id: string;
  year: number;
  month: number;
  isLocked: boolean;
  lockedAt?: string;
  lockedBy?: any;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  journalEntryCount: number;
}

export default function FinancialPeriodsPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [periods, setPeriods] = useState<FinancialPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unlockReason, setUnlockReason] = useState('');
  const [unlockingPeriod, setUnlockingPeriod] = useState<{year: number; month: number} | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadPeriods();
    }
  }, [isAuthenticated, selectedYear]);

  const loadPeriods = async () => {
    try {
      setLoading(true);
      const response = await financialPeriodAPI.getFinancialPeriods({ year: selectedYear });
      setPeriods(response.data.data || []);
    } catch (error) {
      console.error('Failed to load periods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLockPeriod = async (year: number, month: number) => {
    if (confirm(`Lock period ${getMonthName(month)} ${year}? This will prevent any edits to transactions in this period.`)) {
      try {
        await financialPeriodAPI.lockPeriod(year, month);
        loadPeriods();
      } catch (error: any) {
        alert(error.response?.data?.error || 'Failed to lock period');
      }
    }
  };

  const handleUnlockPeriod = async (year: number, month: number) => {
    if (!unlockReason.trim()) {
      alert('Please provide a reason for unlocking this period');
      return;
    }

    try {
      await financialPeriodAPI.unlockPeriod(year, month, unlockReason);
      setUnlockingPeriod(null);
      setUnlockReason('');
      loadPeriods();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to unlock period');
    }
  };

  const handleUpdateSummary = async (year: number, month: number) => {
    try {
      await financialPeriodAPI.updatePeriodSummary(year, month);
      loadPeriods();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update period summary');
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  };

  const getPeriod = (year: number, month: number) => {
    return periods.find(p => p.year === year && p.month === month);
  };

  // Generate calendar grid
  const currentYear = selectedYear;
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading financial periods...</p>
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
        title="Financial Periods"
        subtitle="Lock and manage financial periods"
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Year Selector */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Periods Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {months.map(month => {
            const period = getPeriod(currentYear, month);
            const isLocked = period?.isLocked || false;
            const isCurrentMonth = new Date().getFullYear() === currentYear && new Date().getMonth() + 1 === month;
            const isPast = currentYear < new Date().getFullYear() || 
                          (currentYear === new Date().getFullYear() && month < new Date().getMonth() + 1);

            return (
              <ModernCard key={month} className={`p-6 hover:shadow-lg transition-shadow ${
                isLocked ? 'border-2 border-red-300 dark:border-red-700' : ''
              }`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {getMonthName(month)}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{currentYear}</p>
                  </div>
                  {isLocked ? (
                    <div className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full text-xs font-medium">
                      <Lock className="w-3 h-3" />
                      Locked
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs font-medium">
                      <Unlock className="w-3 h-3" />
                      Open
                    </div>
                  )}
                </div>

                {period && (
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Revenue:</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        ${period.totalRevenue?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Expenses:</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        ${period.totalExpenses?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-gray-900 dark:text-gray-100 font-medium">Net Income:</span>
                      <span className={`font-semibold ${
                        (period.netIncome || 0) >= 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        ${period.netIncome?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      {period.journalEntryCount || 0} journal entries
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  {!isLocked ? (
                    <>
                      {isPast && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleLockPeriod(currentYear, month)}
                          className="flex-1"
                        >
                          <Lock className="w-4 h-4 mr-1" />
                          Lock
                        </Button>
                      )}
                      {period && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUpdateSummary(currentYear, month)}
                          title="Update Summary"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      {user?.role === 'OWNER' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUnlockingPeriod({ year: currentYear, month })}
                          className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                        >
                          <Unlock className="w-4 h-4 mr-1" />
                          Unlock
                        </Button>
                      )}
                      {period?.lockedAt && (
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          Locked {new Date(period.lockedAt).toLocaleDateString()}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </ModernCard>
            );
          })}
        </div>
      </div>

      {/* Unlock Modal */}
      {unlockingPeriod && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              Unlock {getMonthName(unlockingPeriod.month)} {unlockingPeriod.year}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Reason for Unlocking <span className="text-red-600">*</span>
              </label>
              <textarea
                value={unlockReason}
                onChange={(e) => setUnlockReason(e.target.value)}
                placeholder="Enter reason for unlocking this period..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setUnlockingPeriod(null);
                  setUnlockReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleUnlockPeriod(unlockingPeriod.year, unlockingPeriod.month)}
                disabled={!unlockReason.trim()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                Unlock Period
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

