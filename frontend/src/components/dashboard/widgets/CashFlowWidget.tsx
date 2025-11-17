'use client';

import Widget from '../Widget';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { reportsAPI } from '@/lib/api';

interface CashFlowWidgetProps {
  id: string;
  onRemove?: (id: string) => void;
  onSettings?: (id: string) => void;
  dateRange?: { start: string; end: string };
}

export default function CashFlowWidget({ 
  id, 
  onRemove, 
  onSettings,
  dateRange 
}: CashFlowWidgetProps) {
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
      
      const response = await reportsAPI.generateCashFlow({ startDate, endDate });
      setData(response.data.data);
    } catch (error) {
      console.error('Failed to load cash flow data:', error);
    } finally {
      setLoading(false);
    }
  };

  const operating = data?.operating || 0;
  const investing = data?.investing || 0;
  const financing = data?.financing || 0;
  const netChange = data?.netChange || 0;
  const beginningBalance = data?.beginningBalance || 0;
  const endingBalance = data?.endingBalance || 0;

  return (
    <Widget
      id={id}
      title="Cash Flow"
      icon={<TrendingUp className="w-4 h-4" />}
      onRemove={onRemove}
      onSettings={onSettings}
    >
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Operating</span>
              <span className={`font-semibold ${operating >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                ${operating.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Investing</span>
              <span className={`font-semibold ${investing >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                ${investing.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Financing</span>
              <span className={`font-semibold ${financing >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                ${financing.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Net Change</span>
              <span className={`font-bold text-lg ${netChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {netChange >= 0 ? <TrendingUp className="w-4 h-4 inline mr-1" /> : <TrendingDown className="w-4 h-4 inline mr-1" />}
                ${Math.abs(netChange).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
              <span>Beginning: ${beginningBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span>Ending: ${endingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      )}
    </Widget>
  );
}

