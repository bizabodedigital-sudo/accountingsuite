'use client';

import Widget from '../Widget';
import { DollarSign } from 'lucide-react';
import { useEffect, useState } from 'react';
import { reportsAPI } from '@/lib/api';

interface RevenueChartWidgetProps {
  id: string;
  onRemove?: (id: string) => void;
  onSettings?: (id: string) => void;
  dateRange?: { start: string; end: string };
}

export default function RevenueChartWidget({ 
  id, 
  onRemove, 
  onSettings,
  dateRange 
}: RevenueChartWidgetProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      const endDate = dateRange?.end || new Date().toISOString().split('T')[0];
      const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const response = await reportsAPI.generateProfitLoss({ startDate, endDate });
      setData(response.data.data);
    } catch (error) {
      console.error('Failed to load revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const revenue = data?.revenue?.total || 0;
  const expenses = data?.expenses?.total || 0;
  const profit = data?.profit?.net || 0;

  return (
    <Widget
      id={id}
      title="Revenue Overview"
      icon={<DollarSign className="w-4 h-4" />}
      onRemove={onRemove}
      onSettings={onSettings}
    >
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Revenue</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                ${revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Expenses</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">
                ${expenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Profit</p>
              <p className={`text-lg font-bold ${profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                ${profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          
          {/* Simple bar chart */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-16 text-xs text-gray-600 dark:text-gray-400">Revenue</div>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                <div 
                  className="bg-green-500 h-full rounded-full"
                  style={{ width: `${Math.min(100, (revenue / Math.max(revenue, expenses, 1)) * 100)}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 text-xs text-gray-600 dark:text-gray-400">Expenses</div>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                <div 
                  className="bg-red-500 h-full rounded-full"
                  style={{ width: `${Math.min(100, (expenses / Math.max(revenue, expenses, 1)) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </Widget>
  );
}

