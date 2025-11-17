'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Save, Plus, Trash2, CheckCircle } from 'lucide-react';
import { settingsAPI } from '@/lib/api';

export default function PaymentSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState([
    { id: '1', name: 'Cash', enabled: true },
    { id: '2', name: 'Bank Transfer', enabled: true },
    { id: '3', name: 'Cheque', enabled: true },
    { id: '4', name: 'Card', enabled: false },
    { id: '5', name: 'Mobile Wallet', enabled: false }
  ]);
  const [paymentTerms, setPaymentTerms] = useState([
    { id: '1', name: 'Net 7', days: 7 },
    { id: '2', name: 'Net 14', days: 14 },
    { id: '3', name: 'Net 30', days: 30 },
    { id: '4', name: 'Due on Receipt', days: 0 }
  ]);

  useEffect(() => {
    const loadPaymentSettings = async () => {
      try {
        setLoading(true);
        const response = await settingsAPI.getAllSettings();
        const paymentSettings = response.data?.data?.settings?.paymentSettings || {};
        
        if (paymentSettings.defaultPaymentMethods && paymentSettings.defaultPaymentMethods.length > 0) {
          const enabledMethods = paymentSettings.defaultPaymentMethods;
          setPaymentMethods(prev => prev.map(m => ({
            ...m,
            enabled: enabledMethods.includes(m.name)
          })));
        }
        
        if (paymentSettings.paymentTerms && paymentSettings.paymentTerms.length > 0) {
          setPaymentTerms(paymentSettings.paymentTerms.map((t: any, index: number) => ({
            id: String(index + 1),
            name: t.name || '',
            days: t.days || 0
          })));
        }
      } catch (error) {
        console.error('Failed to load payment settings:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadPaymentSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const enabledMethods = paymentMethods.filter(m => m.enabled).map(m => m.name);
      await settingsAPI.updatePaymentSettings({
        defaultPaymentMethods: enabledMethods,
        paymentTerms: paymentTerms.map(t => ({
          name: t.name,
          days: t.days
        }))
      });
      alert('Payment settings saved successfully!');
    } catch (error: any) {
      console.error('Failed to save:', error);
      alert(error.response?.data?.error || 'Failed to save payment settings');
    } finally {
      setSaving(false);
    }
  };

  const togglePaymentMethod = (id: string) => {
    setPaymentMethods(prev => prev.map(m => 
      m.id === id ? { ...m, enabled: !m.enabled } : m
    ));
  };

  return (
    <div className="h-full flex flex-col">
      <Header onMenuClick={() => {}} title="Payment Settings" subtitle="Configure payment methods and terms" showSearch={false} />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <ModernCard title="Default Payment Methods">
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <span className="font-medium">{method.name}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={method.enabled} 
                    onChange={() => togglePaymentMethod(method.id)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </ModernCard>

        <ModernCard title="Payment Terms">
          <div className="space-y-3">
            {paymentTerms.map((term) => (
              <div key={term.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <span className="font-medium">{term.name}</span>
                  <p className="text-sm text-gray-600">{term.days} days</p>
                </div>
              </div>
            ))}
          </div>
        </ModernCard>

        <ModernCard title="Online Payment Gateways">
          <p className="text-gray-600">Configure payment gateways like Stripe, WiPay, etc.</p>
          <Button variant="outline" className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Add Gateway
          </Button>
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

