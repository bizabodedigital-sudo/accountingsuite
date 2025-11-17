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
import {
  Building2,
  Edit,
  Calculator,
  TrendingDown,
  Download,
  Loader2,
  Calendar,
  DollarSign,
} from 'lucide-react';

export default function FixedAssetDetailPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const assetId = params.id as string;
  
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [depreciationAmount, setDepreciationAmount] = useState<number | null>(null);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      loadAsset();
    }
  }, [isLoading, isAuthenticated, assetId]);

  const loadAsset = async () => {
    try {
      setLoading(true);
      const res = await fixedAssetAPI.getFixedAsset(assetId);
      setAsset(res.data.data);
    } catch (error) {
      console.error('Failed to load asset:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateDepreciation = async () => {
    try {
      setCalculating(true);
      const res = await fixedAssetAPI.calculateDepreciation(assetId, {
        asOfDate: new Date().toISOString().split('T')[0]
      });
      setDepreciationAmount(res.data.data.depreciationAmount);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to calculate depreciation');
    } finally {
      setCalculating(false);
    }
  };

  const handlePostDepreciation = async () => {
    if (!depreciationAmount || depreciationAmount <= 0) {
      alert('Please calculate depreciation first');
      return;
    }

    if (!confirm(`Post depreciation of ${depreciationAmount.toFixed(2)}?`)) return;

    try {
      await fixedAssetAPI.postDepreciation(assetId, {
        asOfDate: new Date().toISOString().split('T')[0],
        amount: depreciationAmount
      });
      alert('Depreciation posted successfully!');
      loadAsset();
      setDepreciationAmount(null);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to post depreciation');
    }
  };

  const handleViewSchedule = async () => {
    router.push(`/fixed-assets/${assetId}/depreciation-schedule`);
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

  if (!asset) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Asset not found</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header 
        onMenuClick={() => {}}
        title={asset.name}
        subtitle={`Asset #${asset.assetNumber}`}
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Asset Details */}
          <ModernCard title="Asset Information">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label className="text-gray-500 dark:text-gray-400">Asset Number</Label>
                <p className="font-semibold text-gray-900 dark:text-gray-100 mt-1">{asset.assetNumber}</p>
              </div>
              <div>
                <Label className="text-gray-500 dark:text-gray-400">Category</Label>
                <p className="font-semibold text-gray-900 dark:text-gray-100 mt-1">{asset.category.replace('_', ' ')}</p>
              </div>
              <div>
                <Label className="text-gray-500 dark:text-gray-400">Purchase Date</Label>
                <p className="font-semibold text-gray-900 dark:text-gray-100 mt-1">{formatDate(asset.purchaseDate)}</p>
              </div>
              <div>
                <Label className="text-gray-500 dark:text-gray-400">Status</Label>
                <p className="font-semibold text-gray-900 dark:text-gray-100 mt-1">{asset.status}</p>
              </div>
              {asset.location && (
                <div>
                  <Label className="text-gray-500 dark:text-gray-400">Location</Label>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mt-1">{asset.location}</p>
                </div>
              )}
              {asset.serialNumber && (
                <div>
                  <Label className="text-gray-500 dark:text-gray-400">Serial Number</Label>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mt-1">{asset.serialNumber}</p>
                </div>
              )}
              {asset.vendor && (
                <div>
                  <Label className="text-gray-500 dark:text-gray-400">Vendor</Label>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mt-1">{asset.vendor}</p>
                </div>
              )}
              {asset.description && (
                <div className="col-span-2">
                  <Label className="text-gray-500 dark:text-gray-400">Description</Label>
                  <p className="text-gray-900 dark:text-gray-100 mt-1">{asset.description}</p>
                </div>
              )}
            </div>
          </ModernCard>

          {/* Financial Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <ModernCard>
              <div className="text-center">
                <Label className="text-gray-500 dark:text-gray-400">Purchase Cost</Label>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">{formatCurrency(asset.purchaseCost)}</p>
              </div>
            </ModernCard>
            <ModernCard>
              <div className="text-center">
                <Label className="text-gray-500 dark:text-gray-400">Accumulated Depreciation</Label>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-2">{formatCurrency(asset.accumulatedDepreciation || 0)}</p>
              </div>
            </ModernCard>
            <ModernCard>
              <div className="text-center">
                <Label className="text-gray-500 dark:text-gray-400">Net Book Value</Label>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">{formatCurrency(asset.netBookValue || asset.purchaseCost)}</p>
              </div>
            </ModernCard>
            <ModernCard>
              <div className="text-center">
                <Label className="text-gray-500 dark:text-gray-400">Depreciation Method</Label>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-2">{asset.depreciationMethod.replace('_', ' ')}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{asset.usefulLife} years</p>
              </div>
            </ModernCard>
          </div>

          {/* Depreciation Actions */}
          {asset.status === 'ACTIVE' && (
            <ModernCard title="Depreciation Management">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Button
                    onClick={handleCalculateDepreciation}
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
                  
                  <Button
                    onClick={handleViewSchedule}
                    variant="outline"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    View Schedule
                  </Button>
                </div>

                {depreciationAmount !== null && depreciationAmount > 0 && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">Calculated Depreciation</Label>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                          {formatCurrency(depreciationAmount)}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handlePostDepreciation}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                    >
                      Post Depreciation to Ledger
                    </Button>
                  </div>
                )}
              </div>
            </ModernCard>
          )}

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            {asset.status === 'ACTIVE' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/fixed-assets/${assetId}/edit`)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Asset
                </Button>
              </>
            )}
            <Button
              variant="outline"
              onClick={() => router.push('/fixed-assets')}
            >
              Back to Assets
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

