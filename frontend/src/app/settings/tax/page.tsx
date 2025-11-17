'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, Save, Plus, Trash2, CheckCircle } from 'lucide-react';
import { settingsAPI } from '@/lib/api';

export default function TaxSettingsPage() {
  const { tenant } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [taxTypes, setTaxTypes] = useState([
    { id: '1', name: 'GCT 15%', rate: 15, inclusive: false, default: true }
  ]);
  const [formData, setFormData] = useState({
    registeredForGCT: false,
    trn: '',
    gctRegistrationNo: '',
    defaultTaxRateOnProducts: 15,
    shippingTaxBehavior: 'standard'
  });

  useEffect(() => {
    const loadTaxSettings = async () => {
      try {
        setLoading(true);
        const response = await settingsAPI.getAllSettings();
        const taxSettings = response.data?.data?.settings?.taxSettings || {};
        
        setFormData(prev => ({
          ...prev,
          registeredForGCT: taxSettings.registeredForGCT || false,
          trn: tenant?.taxId || '',
          gctRegistrationNo: taxSettings.gctRegistrationNo || '',
          defaultTaxRateOnProducts: taxSettings.defaultTaxRateOnProducts || 15,
          shippingTaxBehavior: taxSettings.shippingTaxBehavior || 'standard'
        }));
        
        if (taxSettings.taxTypes && taxSettings.taxTypes.length > 0) {
          setTaxTypes(taxSettings.taxTypes.map((t: any, index: number) => ({
            id: String(index + 1),
            name: t.name || '',
            rate: t.rate || 0,
            inclusive: t.inclusive || false,
            default: t.isDefault || false
          })));
        }
      } catch (error) {
        console.error('Failed to load tax settings:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadTaxSettings();
  }, [tenant]);

  const addTaxType = () => {
    setTaxTypes([...taxTypes, {
      id: Date.now().toString(),
      name: '',
      rate: 0,
      inclusive: false,
      default: false
    }]);
  };

  const removeTaxType = (id: string) => {
    setTaxTypes(taxTypes.filter(t => t.id !== id));
  };

  const updateTaxType = (id: string, field: string, value: any) => {
    setTaxTypes(taxTypes.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await settingsAPI.updateTaxSettings({
        registeredForGCT: formData.registeredForGCT,
        trn: formData.trn,
        gctRegistrationNo: formData.gctRegistrationNo,
        defaultTaxRateOnProducts: formData.defaultTaxRateOnProducts,
        shippingTaxBehavior: formData.shippingTaxBehavior,
        taxTypes: taxTypes.map(t => ({
          name: t.name,
          rate: t.rate,
          inclusive: t.inclusive,
          isDefault: t.default
        }))
      });
      alert('Tax settings saved successfully!');
    } catch (error: any) {
      console.error('Failed to save:', error);
      alert(error.response?.data?.error || 'Failed to save tax settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Header
        onMenuClick={() => {}}
        title="Tax Settings"
        subtitle="Configure tax types and rates for Jamaican businesses"
        showSearch={false}
      />
      
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Tax Types */}
        <ModernCard title="Tax Types">
          <div className="space-y-4">
            {taxTypes.map((taxType) => (
              <div key={taxType.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Tax Name</Label>
                    <Input
                      value={taxType.name}
                      onChange={(e) => updateTaxType(taxType.id, 'name', e.target.value)}
                      placeholder="e.g., GCT 15%"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Rate (%)</Label>
                    <Input
                      type="number"
                      value={taxType.rate}
                      onChange={(e) => updateTaxType(taxType.id, 'rate', parseFloat(e.target.value))}
                      placeholder="15"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <select
                      value={taxType.inclusive ? 'inclusive' : 'exclusive'}
                      onChange={(e) => updateTaxType(taxType.id, 'inclusive', e.target.value === 'inclusive')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="exclusive">Exclusive</option>
                      <option value="inclusive">Inclusive</option>
                    </select>
                  </div>
                  
                  <div className="flex items-end space-x-2">
                    {taxType.default && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        Default
                      </span>
                    )}
                    {!taxType.default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeTaxType(taxType.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            <Button variant="outline" onClick={addTaxType}>
              <Plus className="w-4 h-4 mr-2" />
              Add Tax Type
            </Button>
          </div>
        </ModernCard>

        {/* Tax Regime */}
        <ModernCard title="Tax Regime">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium">Registered for GCT?</h4>
                <p className="text-sm text-gray-600">Is your business registered for General Consumption Tax?</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.registeredForGCT}
                  onChange={(e) => setFormData({ ...formData, registeredForGCT: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            {formData.registeredForGCT && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="trn">TRN (Tax Registration Number)</Label>
                  <Input
                    id="trn"
                    value={formData.trn}
                    onChange={(e) => setFormData({ ...formData, trn: e.target.value })}
                    placeholder="123-456-789"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="gctRegistrationNo">GCT Registration Number</Label>
                  <Input
                    id="gctRegistrationNo"
                    value={formData.gctRegistrationNo}
                    onChange={(e) => setFormData({ ...formData, gctRegistrationNo: e.target.value })}
                    placeholder="GCT number"
                  />
                </div>
              </>
            )}
          </div>
        </ModernCard>

        {/* Defaults */}
        <ModernCard title="Defaults">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="defaultTaxRateOnProducts">Default Tax Rate on Products (%)</Label>
              <Input
                id="defaultTaxRateOnProducts"
                type="number"
                value={formData.defaultTaxRateOnProducts}
                onChange={(e) => setFormData({ ...formData, defaultTaxRateOnProducts: parseFloat(e.target.value) })}
                placeholder="15"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="shippingTaxBehavior">Shipping Tax Behavior</Label>
              <select
                id="shippingTaxBehavior"
                value={formData.shippingTaxBehavior}
                onChange={(e) => setFormData({ ...formData, shippingTaxBehavior: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="standard">Standard Rate</option>
                <option value="zero">Zero-Rated</option>
                <option value="exempt">Exempt</option>
              </select>
            </div>
          </div>
        </ModernCard>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}

