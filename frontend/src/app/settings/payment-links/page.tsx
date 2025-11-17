'use client';

import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Link2, Plus } from 'lucide-react';

export default function PaymentLinksPage() {
  return (
    <div className="h-full flex flex-col">
      <Header onMenuClick={() => {}} title="Payment Links" subtitle="Create and manage payment links" showSearch={false} />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <ModernCard title="Payment Links">
          <p className="text-gray-600 mb-4">Create generic 'Pay Now' links for quick payments</p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Payment Link
          </Button>
        </ModernCard>
      </div>
    </div>
  );
}

