'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Receipt, Save, Plus, Trash2 } from 'lucide-react';

export default function ExpenseSettingsPage() {
  const [formData, setFormData] = useState({
    defaultExpenseAccount: 'General Expenses',
    defaultTaxTreatment: 'claimable',
    receiptAttachmentRequired: true
  });
  const [categories, setCategories] = useState([
    'Office Supplies', 'Travel', 'Meals', 'Utilities', 'Rent', 'Marketing'
  ]);

  return (
    <div className="h-full flex flex-col">
      <Header onMenuClick={() => {}} title="Expense Settings" subtitle="Configure expense defaults and categories" showSearch={false} />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <ModernCard title="Expense Defaults">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="defaultExpenseAccount">Default Expense Account</Label>
              <Input
                id="defaultExpenseAccount"
                value={formData.defaultExpenseAccount}
                onChange={(e) => setFormData({ ...formData, defaultExpenseAccount: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="defaultTaxTreatment">Default Tax Treatment</Label>
              <select
                id="defaultTaxTreatment"
                value={formData.defaultTaxTreatment}
                onChange={(e) => setFormData({ ...formData, defaultTaxTreatment: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="claimable">Tax Claimable</option>
                <option value="non-claimable">Non-Claimable</option>
              </select>
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.receiptAttachmentRequired}
                  onChange={(e) => setFormData({ ...formData, receiptAttachmentRequired: e.target.checked })}
                  className="rounded"
                />
                <span>Require Receipt Attachment</span>
              </label>
            </div>
          </div>
        </ModernCard>

        <ModernCard title="Expense Categories">
          <div className="space-y-2">
            {categories.map((cat, index) => (
              <div key={index} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                <span>{cat}</span>
                <Button variant="ghost" size="sm">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </div>
        </ModernCard>
      </div>
    </div>
  );
}

