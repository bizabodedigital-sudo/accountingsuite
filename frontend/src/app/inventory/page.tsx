'use client';

import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Warehouse, Plus, TrendingDown, AlertTriangle, Package, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function InventoryPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [inventorySummary, setInventorySummary] = useState<any>(null);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadInventoryData();
    }
  }, [isAuthenticated]);

  const loadInventoryData = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API calls
      // const summaryRes = await fetch('/api/inventory/summary');
      // const lowStockRes = await fetch('/api/inventory/low-stock');
      
      // Mock data for now
      setInventorySummary({
        totalProducts: 25,
        totalValue: 125000,
        totalQuantity: 450,
        lowStockCount: 3,
        outOfStockCount: 1
      });
      
      setLowStockItems([
        { id: '1', name: 'Product A', stockQuantity: 5, minStockLevel: 10 },
        { id: '2', name: 'Product B', stockQuantity: 2, minStockLevel: 15 }
      ]);
    } catch (error) {
      console.error('Failed to load inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-full flex flex-col">
      <Header 
        onMenuClick={() => {}}
        title="Inventory Management"
        subtitle="Track and manage your stock levels, movements, and inventory value"
      />
      
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ModernCard className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{inventorySummary?.totalProducts || 0}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </ModernCard>

          <ModernCard className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">J${inventorySummary?.totalValue?.toLocaleString() || '0'}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-green-600" />
            </div>
          </ModernCard>

          <ModernCard className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Quantity</p>
                <p className="text-2xl font-bold text-gray-900">{inventorySummary?.totalQuantity || 0}</p>
              </div>
              <Warehouse className="w-8 h-8 text-orange-600" />
            </div>
          </ModernCard>

          <ModernCard className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Low Stock</p>
                <p className="text-2xl font-bold text-gray-900">{inventorySummary?.lowStockCount || 0}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </ModernCard>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ModernCard title="Quick Actions" className="lg:col-span-1">
            <div className="space-y-3">
              <Button asChild className="w-full justify-start">
                <Link href="/inventory/adjust">
                  <Plus className="w-4 h-4 mr-2" />
                  Adjust Inventory
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/inventory/movements">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Movements
                </Link>
              </Button>
            </div>
          </ModernCard>

          <ModernCard title="Low Stock Alerts" className="lg:col-span-2">
            {lowStockItems.length > 0 ? (
              <div className="space-y-3">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        Stock: {item.stockQuantity} / Min: {item.minStockLevel}
                      </p>
                    </div>
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No low stock items</p>
            )}
          </ModernCard>
        </div>
      </div>
    </div>
  );
}

