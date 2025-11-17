'use client';

import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { CreditCard, Plus, Building2 } from 'lucide-react';

export default function BanksPage() {
  return (
    <div className="h-full flex flex-col">
      <Header onMenuClick={() => {}} title="Credit Cards & Banks" subtitle="Manage bank accounts and payment methods" showSearch={false} />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <ModernCard title="Bank Accounts">
          <p className="text-gray-600 mb-4">Manage your business bank accounts</p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Bank Account
          </Button>
        </ModernCard>

        <ModernCard title="Credit Cards">
          <p className="text-gray-600 mb-4">Saved credit cards for payments</p>
          <Button variant="outline">
            <CreditCard className="w-4 h-4 mr-2" />
            Add Credit Card
          </Button>
        </ModernCard>
      </div>
    </div>
  );
}

