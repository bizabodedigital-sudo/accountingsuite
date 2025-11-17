'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { fixedAssetAPI, chartOfAccountAPI } from '@/lib/api';
import { Loader2, Save, X } from 'lucide-react';

export default function CreateFixedAssetPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    assetNumber: '',
    name: '',
    description: '',
    category: 'EQUIPMENT',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseCost: '',
    depreciationMethod: 'STRAIGHT_LINE',
    usefulLife: 5,
    depreciationRate: 20,
    location: '',
    serialNumber: '',
    vendor: '',
    accountId: '',
    depreciationExpenseAccountId: '',
    accumulatedDepreciationAccountId: '',
    paymentAccountId: '',
    notes: ''
  });

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      loadAccounts();
    }
  }, [isLoading, isAuthenticated]);

  const loadAccounts = async () => {
    try {
      const response = await chartOfAccountAPI.getAccounts({ isActive: true });
      setAccounts(response.data.data || []);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.accountId || !formData.paymentAccountId) {
      alert('Please select asset account and payment account');
      return;
    }

    try {
      setSaving(true);
      const dataToSend: any = {
        ...formData,
        purchaseCost: parseFloat(String(formData.purchaseCost)) || 0,
        usefulLife: parseInt(String(formData.usefulLife)) || 5,
        depreciationRate: parseFloat(String(formData.depreciationRate)) || 20,
      };
      
      await fixedAssetAPI.createFixedAsset(dataToSend);
      router.push('/fixed-assets');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create asset');
    } finally {
      setSaving(false);
    }
  };

  const assetAccounts = accounts.filter(a => a.type === 'ASSET');
  const expenseAccounts = accounts.filter(a => a.type === 'EXPENSE');
  const paymentAccounts = accounts.filter(a => 
    a.type === 'ASSET' && (a.category === 'Cash' || a.category === 'Bank' || a.code?.includes('CASH') || a.code?.includes('BANK'))
  );

  if (!isAuthenticated && !isLoading) {
    router.push('/login');
    return null;
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header 
        onMenuClick={() => {}}
        title="Add Fixed Asset"
        subtitle="Register a new fixed asset"
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <ModernCard title="Asset Details">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="assetNumber">Asset Number *</Label>
                  <Input
                    id="assetNumber"
                    value={formData.assetNumber}
                    onChange={(e) => setFormData({ ...formData, assetNumber: e.target.value.toUpperCase() })}
                    className="mt-2"
                    required
                    placeholder="ASSET-001"
                  />
                </div>

                <div>
                  <Label htmlFor="name">Asset Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-2"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full mt-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full mt-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  >
                    <option value="BUILDING">Building</option>
                    <option value="VEHICLE">Vehicle</option>
                    <option value="EQUIPMENT">Equipment</option>
                    <option value="FURNITURE">Furniture</option>
                    <option value="COMPUTER">Computer</option>
                    <option value="SOFTWARE">Software</option>
                    <option value="MACHINERY">Machinery</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="purchaseDate">Purchase Date *</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    className="mt-2"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="purchaseCost">Purchase Cost *</Label>
                  <Input
                    id="purchaseCost"
                    type="number"
                    step="0.01"
                    value={formData.purchaseCost}
                    onChange={(e) => setFormData({ ...formData, purchaseCost: e.target.value === '' ? '' : parseFloat(e.target.value) || '' })}
                    className="mt-2"
                    required
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="vendor">Vendor</Label>
                  <Input
                    id="vendor"
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  <Input
                    id="serialNumber"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Depreciation Settings</h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="depreciationMethod">Method *</Label>
                    <select
                      id="depreciationMethod"
                      value={formData.depreciationMethod}
                      onChange={(e) => setFormData({ ...formData, depreciationMethod: e.target.value })}
                      className="w-full mt-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      required
                    >
                      <option value="STRAIGHT_LINE">Straight Line</option>
                      <option value="DECLINING_BALANCE">Declining Balance</option>
                      <option value="NONE">None</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="usefulLife">Useful Life (Years) *</Label>
                    <Input
                      id="usefulLife"
                      type="number"
                      min="1"
                      value={formData.usefulLife}
                      onChange={(e) => setFormData({ ...formData, usefulLife: parseInt(e.target.value) || 5 })}
                      className="mt-2"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="depreciationRate">Depreciation Rate (%)</Label>
                    <Input
                      id="depreciationRate"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.depreciationRate}
                      onChange={(e) => setFormData({ ...formData, depreciationRate: e.target.value === '' ? '' : parseFloat(e.target.value) || '' })}
                      className="mt-2"
                      placeholder="20"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Accounting Accounts</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="accountId">Asset Account *</Label>
                    <select
                      id="accountId"
                      value={formData.accountId}
                      onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                      className="w-full mt-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      required
                    >
                      <option value="">Select Account</option>
                      {assetAccounts.map(acc => (
                        <option key={acc._id} value={acc._id}>{acc.code} - {acc.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="paymentAccountId">Payment Account *</Label>
                    <select
                      id="paymentAccountId"
                      value={formData.paymentAccountId}
                      onChange={(e) => setFormData({ ...formData, paymentAccountId: e.target.value })}
                      className="w-full mt-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      required
                    >
                      <option value="">Select Account</option>
                      {paymentAccounts.map(acc => (
                        <option key={acc._id} value={acc._id}>{acc.code} - {acc.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="depreciationExpenseAccountId">Depreciation Expense Account</Label>
                    <select
                      id="depreciationExpenseAccountId"
                      value={formData.depreciationExpenseAccountId}
                      onChange={(e) => setFormData({ ...formData, depreciationExpenseAccountId: e.target.value })}
                      className="w-full mt-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Select Account (Optional)</option>
                      {expenseAccounts.map(acc => (
                        <option key={acc._id} value={acc._id}>{acc.code} - {acc.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="accumulatedDepreciationAccountId">Accumulated Depreciation Account</Label>
                    <select
                      id="accumulatedDepreciationAccountId"
                      value={formData.accumulatedDepreciationAccountId}
                      onChange={(e) => setFormData({ ...formData, accumulatedDepreciationAccountId: e.target.value })}
                      className="w-full mt-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Select Account (Optional)</option>
                      {assetAccounts.map(acc => (
                        <option key={acc._id} value={acc._id}>{acc.code} - {acc.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full mt-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  rows={3}
                />
              </div>

              <div className="flex gap-4 justify-end pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Create Asset
                    </>
                  )}
                </Button>
              </div>
            </form>
          </ModernCard>
        </div>
      </div>
    </div>
  );
}
