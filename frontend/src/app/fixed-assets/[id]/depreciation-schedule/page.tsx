'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { fixedAssetAPI } from '@/lib/api';
import { Loader2, ArrowLeft, Download } from 'lucide-react';

export default function DepreciationSchedulePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const assetId = params.id as string;
  
  const [schedule, setSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      loadSchedule();
    }
  }, [isLoading, isAuthenticated, assetId]);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const res = await fixedAssetAPI.getDepreciationSchedule(assetId);
      setSchedule(res.data.data);
    } catch (error) {
      console.error('Failed to load schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `J$ ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Schedule not found</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header 
        onMenuClick={() => {}}
        title="Depreciation Schedule"
        subtitle={schedule.asset.name}
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <ModernCard title="Asset Information">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Purchase Cost</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(schedule.asset.purchaseCost)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Useful Life</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{schedule.asset.usefulLife} years</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Method</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{schedule.asset.depreciationMethod.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Depreciation</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(schedule.asset.purchaseCost / (schedule.asset.usefulLife * 12))}
                </p>
              </div>
            </div>
          </ModernCard>

          <ModernCard title="Depreciation Schedule">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Period</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Date</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Depreciation</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Accumulated</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Book Value</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.schedule.map((entry: any, index: number) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4">{entry.period}</td>
                      <td className="py-3 px-4">{formatDate(entry.date)}</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(entry.depreciation)}</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(entry.accumulatedDepreciation)}</td>
                      <td className="py-3 px-4 text-right font-semibold">{formatCurrency(entry.bookValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ModernCard>

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => router.push(`/fixed-assets/${assetId}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Asset
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

