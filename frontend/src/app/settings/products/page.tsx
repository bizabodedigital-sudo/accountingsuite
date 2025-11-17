'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Package, Save } from 'lucide-react';
import { settingsAPI } from '@/lib/api';

export default function ProductSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    defaultIncomeAccount: '',
    defaultTaxRateOnProducts: 15,
    productTypes: ['GOODS', 'SERVICES'],
    skuGenerationRule: 'auto',
    inventoryTracking: true
  });

  useEffect(() => {
    const loadProductSettings = async () => {
      try {
        setLoading(true);
        const response = await settingsAPI.getAllSettings();
        const productSettings = response.data?.data?.settings?.productSettings || {};
        
        setFormData(prev => ({
          ...prev,
          defaultIncomeAccount: productSettings.defaultIncomeAccount || '',
          defaultTaxRateOnProducts: productSettings.defaultTaxRateOnProducts || 15,
          skuGenerationRule: productSettings.skuGenerationRule || 'auto',
          inventoryTracking: productSettings.inventoryTracking !== undefined ? productSettings.inventoryTracking : true
        }));
      } catch (error) {
        console.error('Failed to load product settings:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadProductSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await settingsAPI.updateProductSettings({
        defaultIncomeAccount: formData.defaultIncomeAccount,
        defaultTaxRateOnProducts: formData.defaultTaxRateOnProducts,
        skuGenerationRule: formData.skuGenerationRule,
        inventoryTracking: formData.inventoryTracking
      });
      alert('Product settings saved successfully!');
    } catch (error: any) {
      console.error('Failed to save:', error);
      alert(error.response?.data?.error || 'Failed to save product settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Header onMenuClick={() => {}} title="Product Settings" subtitle="Configure product defaults and rules" showSearch={false} />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <ModernCard title="Product Defaults">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="defaultTaxRateOnProducts">Default Tax Rate on Products (%)</Label>
              <Input
                id="defaultTaxRateOnProducts"
                type="number"
                value={formData.defaultTaxRateOnProducts}
                onChange={(e) => setFormData({ ...formData, defaultTaxRateOnProducts: parseFloat(e.target.value) })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="skuGenerationRule">SKU Generation Rule</Label>
              <select
                id="skuGenerationRule"
                value={formData.skuGenerationRule}
                onChange={(e) => setFormData({ ...formData, skuGenerationRule: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="auto">Auto-generate</option>
                <option value="manual">Manual entry</option>
              </select>
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.inventoryTracking}
                  onChange={(e) => setFormData({ ...formData, inventoryTracking: e.target.checked })}
                  className="rounded"
                />
                <span>Enable Inventory Tracking</span>
              </label>
            </div>
          </div>
        </ModernCard>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving || loading}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}

