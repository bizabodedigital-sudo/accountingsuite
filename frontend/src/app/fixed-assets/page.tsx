'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { fixedAssetAPI, chartOfAccountAPI } from '@/lib/api';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Calculator,
  TrendingDown,
  Download,
  Loader2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface FixedAsset {
  _id: string;
  assetNumber: string;
  name: string;
  category: string;
  purchaseDate: string;
  purchaseCost: number;
  currentValue: number;
  netBookValue: number;
  accumulatedDepreciation: number;
  status: string;
  accountId?: {
    _id: string;
    code: string;
    name: string;
  };
}

export default function FixedAssetsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      loadAssets();
    }
  }, [isLoading, isAuthenticated, currentPage, filterStatus, filterCategory]);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 10,
      };
      
      if (filterStatus !== 'All') {
        params.status = filterStatus;
      }
      
      if (filterCategory !== 'All') {
        params.category = filterCategory;
      }
      
      if (search) {
        params.search = search;
      }

      const res = await fixedAssetAPI.getFixedAssets(params);
      setAssets(res.data.data || []);
      setTotalPages(res.data.pagination?.pages || 1);
    } catch (error) {
      console.error('Failed to load assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this asset?')) return;
    
    try {
      await fixedAssetAPI.deleteFixedAsset(id);
      loadAssets();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete asset');
    }
  };

  const formatCurrency = (amount: number) => {
    return `J$ ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300';
      case 'DISPOSED':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
      case 'SOLD':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300';
      case 'SCRAPPED':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const categories = ['All', 'BUILDING', 'VEHICLE', 'EQUIPMENT', 'FURNITURE', 'COMPUTER', 'SOFTWARE', 'MACHINERY', 'OTHER'];
  const statuses = ['All', 'ACTIVE', 'DISPOSED', 'SOLD', 'SCRAPPED'];

  if (!isAuthenticated && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header 
        onMenuClick={() => {}}
        title="Fixed Assets"
        subtitle="Manage fixed assets and depreciation"
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Actions Bar */}
          <div className="flex justify-between items-center">
            <div className="flex gap-4 items-center flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search assets..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              
              <select
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            
            <Button
              onClick={() => router.push('/fixed-assets/create')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Asset
            </Button>
          </div>

          {/* Assets List */}
          <ModernCard title="Fixed Assets Register">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : assets.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">No assets found</p>
                <Button
                  onClick={() => router.push('/fixed-assets/create')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Asset
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Asset #</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Category</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Purchase Date</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Purchase Cost</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Accum. Depreciation</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Net Book Value</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map(asset => (
                      <tr key={asset._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{asset.assetNumber}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{asset.name}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-600 dark:text-gray-400">{asset.category.replace('_', ' ')}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-600 dark:text-gray-400">{formatDate(asset.purchaseDate)}</div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(asset.purchaseCost)}</div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="text-sm text-gray-600 dark:text-gray-400">{formatCurrency(asset.accumulatedDepreciation || 0)}</div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(asset.netBookValue || asset.purchaseCost)}</div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(asset.status)}`}>
                            {asset.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/fixed-assets/${asset._id}`)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {asset.status === 'ACTIVE' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => router.push(`/fixed-assets/${asset._id}/edit`)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => router.push(`/fixed-assets/${asset._id}/depreciation`)}
                                  title="Calculate Depreciation"
                                >
                                  <Calculator className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(asset._id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </ModernCard>
        </div>
      </div>
    </div>
  );
}

