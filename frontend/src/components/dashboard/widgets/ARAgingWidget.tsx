'use client';

import Widget from '../Widget';
import { Clock, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { reportsAPI } from '@/lib/api';

interface ARAgingWidgetProps {
  id: string;
  onRemove?: (id: string) => void;
  onSettings?: (id: string) => void;
}

export default function ARAgingWidget({ 
  id, 
  onRemove, 
  onSettings
}: ARAgingWidgetProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await reportsAPI.generateAccountsReceivableAging();
      setData(response.data.data);
    } catch (error) {
      console.error('Failed to load AR aging data:', error);
    } finally {
      setLoading(false);
    }
  };

  const current = data?.current || 0;
  const days30 = data?.days30 || 0;
  const days60 = data?.days60 || 0;
  const days90 = data?.days90 || 0;
  const over90 = data?.over90 || 0;
  const total = data?.total || 0;

  return (
    <Widget
      id={id}
      title="Accounts Receivable Aging"
      icon={<Clock className="w-4 h-4" />}
      onRemove={onRemove}
      onSettings={onSettings}
    >
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-center pb-2 border-b border-gray-200 dark:border-gray-700">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Outstanding</p>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Current</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                ${current.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">1-30 days</span>
              <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                ${days30.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">31-60 days</span>
              <span className="font-semibold text-orange-600 dark:text-orange-400">
                ${days60.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">61-90 days</span>
              <span className="font-semibold text-red-600 dark:text-red-400">
                ${days90.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="font-semibold text-gray-900 dark:text-gray-100">Over 90 days</span>
              <span className="font-bold text-red-700 dark:text-red-500">
                ${over90.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {over90 > 0 && (
            <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                <p className="text-xs text-red-700 dark:text-red-300">
                  ${over90.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} overdue
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </Widget>
  );
}

