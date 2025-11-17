'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { fixedAssetAPI } from '@/lib/api';
import { Calculator, Save, Loader2, ArrowLeft, TrendingDown, Download } from 'lucide-react';

export default function DepreciationPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const assetId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [posting, setPosting] = useState(false);
  const [asset, setAsset] = useState<any>(null);
  const [depreciation, setDepreciation] = useState<any>(null);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [schedule, setSchedule] = useState<any>(null);

  useEffect(() => {
    if (isAuthenticated && assetId) {
      loadAsset();
      loadSchedule();
    }
  }, [isAuthenticated, assetId]);

  const loadAsset = async () => {
    try {
      const res = await fixedAssetAPI.getFixedAsset(assetId);
      setAsset(res.data.data);
    } catch (error) {
      console.error('Failed to load asset:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSchedule = async () => {
    try {
      const res = await fixedAssetAPI.getDepreciationSchedule(assetId);
      setSchedule(res.data.data);
    } catch (error) {
      console.error('Failed to load schedule:', error);
    }
  };

  const handleCalculate = async () => {
    try {
      setCalculating(true);
      const res = await fixedAssetAPI.calculateDepreciation(assetId, { asOfDate });
      setDepreciation(res.data.data);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to calculate depreciation');
    } finally {
      setCalculating(false);
    }
  };

  const handlePost = async () => {
    if (!depreciation || !confirm(`Post depreciation of ${formatCurrency(depreciation.depreciationAmount)}?`)) {
      return;
    }

    try {
      setPosting(true);
      await fixedAssetAPI.postDepreciation(assetId, {
        asOfDate,
        amount: depreciation.depreciationAmount
      });
      alert('Depreciation posted successfully!');
      loadAsset();
      setDepreciation(null);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to post depreciation');
    } finally {
      setPosting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `J$ ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (!isAuthenticated || loading) {
    return null;
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header 
        onMenuClick={() => {}}
        title={`Depreciation: ${asset?.name || ''}`}
        subtitle="Calculate and post depreciation"
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {asset && (
            <ModernCard title="Asset Information">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Purchase Cost</p>
                  <p className="text-lg font-semibold">{formatCurrency(asset.purchaseCost)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Accumulated Depreciation</p>
                  <p className="text-lg font-semibold">{formatCurrency(asset.accumulatedDepreciation || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Net Book Value</p>
                  <p className="text-lg font-semibold">{formatCurrency(asset.netBookValue || asset.purchaseCost)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Method</p>
                  <p className="text-lg font-semibold">{asset.depreciationMethod?.replace('_', ' ')}</p>
                </div>
              </div>
            </ModernCard>
          )}

          <ModernCard title="Calculate Depreciation">
            <div className="space-y-4">
              <div>
                <Label htmlFor="asOfDate">As Of Date</Label>
                <Input
                  id="asOfDate"
                  type="date"
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value)}
                  className="mt-2"
                />
              </div>

              <Button
                onClick={handleCalculate}
                disabled={calculating}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                {calculating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4 mr-2" />
                    Calculate Depreciation
                  </>
                )}
              </Button>

              {depreciation && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h3 className="font-semibold mb-4">Depreciation Calculation</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Current Book Value</p>
                      <p className="text-xl font-bold">{formatCurrency(depreciation.currentBookValue)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Depreciation Amount</p>
                      <p className="text-xl font-bold text-red-600">{formatCurrency(depreciation.depreciationAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">New Book Value</p>
                      <p className="text-xl font-bold text-green-600">{formatCurrency(depreciation.newBookValue)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Months Since Last</p>
                      <p className="text-xl font-bold">{depreciation.monthsSinceLastDepreciation}</p>
                    </div>
                  </div>

                  <Button
                    onClick={handlePost}
                    disabled={posting}
                    className="mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                  >
                    {posting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Post to Ledger
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </ModernCard>

          {schedule && (
            <ModernCard title="Depreciation Schedule">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold">Period</th>
                      <th className="text-left py-3 px-4 font-semibold">Date</th>
                      <th className="text-right py-3 px-4 font-semibold">Depreciation</th>
                      <th className="text-right py-3 px-4 font-semibold">Accumulated</th>
                      <th className="text-right py-3 px-4 font-semibold">Book Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.schedule?.slice(0, 12).map((entry: any, idx: number) => (
                      <tr key={idx} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-3 px-4">{entry.period}</td>
                        <td className="py-3 px-4">{new Date(entry.date).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(entry.depreciation)}</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(entry.accumulatedDepreciation)}</td>
                        <td className="py-3 px-4 text-right font-semibold">{formatCurrency(entry.bookValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {schedule.schedule && schedule.schedule.length > 12 && (
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  Showing first 12 periods of {schedule.schedule.length} total
                </p>
              )}
            </ModernCard>
          )}
        </div>
      </div>
    </div>
  );
}

