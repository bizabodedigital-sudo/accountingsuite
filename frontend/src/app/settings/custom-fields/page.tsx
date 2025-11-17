'use client';

import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Plus, FileCode } from 'lucide-react';

export default function CustomFieldsPage() {
  return (
    <div className="h-full flex flex-col">
      <Header onMenuClick={() => {}} title="Custom Fields" subtitle="Define custom fields for entities" showSearch={false} />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <ModernCard title="Custom Fields">
          <p className="text-gray-600 mb-4">Create custom fields for Company, Client, Invoice, Payment, Product, Expense, and Project entities</p>
          <div className="space-y-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium mb-2">Entity Types</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                {['Company', 'Client', 'Invoice', 'Payment', 'Product', 'Expense', 'Project'].map((entity) => (
                  <div key={entity} className="p-2 bg-gray-50 rounded">
                    {entity}
                  </div>
                ))}
              </div>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Custom Field
            </Button>
          </div>
        </ModernCard>
      </div>
    </div>
  );
}

