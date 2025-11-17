'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Hash, Save, Lock } from 'lucide-react';

export default function NumberingPage() {
  const [formData, setFormData] = useState({
    invoicePrefix: 'INV',
    invoicePadding: 4,
    quotePrefix: 'QUO',
    quotePadding: 4,
    poPrefix: 'PO',
    poPadding: 4,
    creditNotePrefix: 'CN',
    creditNotePadding: 4,
    separateCountersPerYear: false
  });

  return (
    <div className="h-full flex flex-col">
      <Header onMenuClick={() => {}} title="Generated Numbers" subtitle="Configure numbering sequences for documents" showSearch={false} />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="absolute top-4 right-4">
          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs flex items-center">
            <Lock className="w-3 h-3 mr-1" />
            Pro Feature
          </span>
        </div>

        <ModernCard title="Invoice Numbering">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="invoicePrefix">Prefix</Label>
              <Input
                id="invoicePrefix"
                value={formData.invoicePrefix}
                onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                placeholder="INV"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoicePadding">Padding (digits)</Label>
              <Input
                id="invoicePadding"
                type="number"
                value={formData.invoicePadding}
                onChange={(e) => setFormData({ ...formData, invoicePadding: parseInt(e.target.value) })}
                placeholder="4"
              />
            </div>
            <div className="text-sm text-gray-600">
              Example: {formData.invoicePrefix}-{String(1).padStart(formData.invoicePadding, '0')}
            </div>
          </div>
        </ModernCard>

        <ModernCard title="Quote Numbering">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="quotePrefix">Prefix</Label>
              <Input
                id="quotePrefix"
                value={formData.quotePrefix}
                onChange={(e) => setFormData({ ...formData, quotePrefix: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quotePadding">Padding</Label>
              <Input
                id="quotePadding"
                type="number"
                value={formData.quotePadding}
                onChange={(e) => setFormData({ ...formData, quotePadding: parseInt(e.target.value) })}
              />
            </div>
          </div>
        </ModernCard>

        <div className="flex justify-end">
          <Button disabled>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

