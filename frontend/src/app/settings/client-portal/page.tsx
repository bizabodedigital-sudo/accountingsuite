'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users2, Save, Globe } from 'lucide-react';

export default function ClientPortalPage() {
  const [formData, setFormData] = useState({
    portalUrl: '',
    portalEnabled: false,
    allowViewInvoices: true,
    allowViewQuotes: true,
    allowViewPaymentHistory: true,
    allowViewDocuments: false,
    allowCardPayments: false,
    loginMethod: 'email'
  });

  return (
    <div className="h-full flex flex-col">
      <Header onMenuClick={() => {}} title="Client Portal" subtitle="Configure client portal settings" showSearch={false} />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <ModernCard title="Portal Configuration">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="portalUrl">Portal URL</Label>
              <Input
                id="portalUrl"
                value={formData.portalUrl}
                onChange={(e) => setFormData({ ...formData, portalUrl: e.target.value })}
                placeholder="clients.yourcompany.com"
              />
            </div>
            
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium">Enable Client Portal</h4>
                <p className="text-sm text-gray-600">Allow clients to access their portal</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.portalEnabled}
                  onChange={(e) => setFormData({ ...formData, portalEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </ModernCard>

        <ModernCard title="Portal Permissions">
          <div className="space-y-3">
            {[
              { key: 'allowViewInvoices', label: 'View Invoices' },
              { key: 'allowViewQuotes', label: 'View Quotes' },
              { key: 'allowViewPaymentHistory', label: 'View Payment History' },
              { key: 'allowViewDocuments', label: 'View Documents' },
              { key: 'allowCardPayments', label: 'Allow Card Payments via Portal' }
            ].map((perm) => (
              <div key={perm.key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <span>{perm.label}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData[perm.key as keyof typeof formData] as boolean}
                    onChange={(e) => setFormData({ ...formData, [perm.key]: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </ModernCard>
      </div>
    </div>
  );
}

