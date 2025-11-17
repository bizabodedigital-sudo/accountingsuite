'use client';

import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { FileCode, Lock } from 'lucide-react';

export default function EInvoicingPage() {
  return (
    <div className="h-full flex flex-col">
      <Header onMenuClick={() => {}} title="E-Invoicing" subtitle="Configure electronic invoicing compliance" showSearch={false} />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <ModernCard title="E-Invoicing Settings" className="relative">
          <div className="absolute top-4 right-4">
            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs flex items-center">
              <Lock className="w-3 h-3 mr-1" />
              Pro Feature
            </span>
          </div>
          <p className="text-gray-600 mb-4">Enable e-invoicing for compliance with local regulations</p>
          <Button disabled>
            <FileCode className="w-4 h-4 mr-2" />
            Enable E-Invoicing
          </Button>
        </ModernCard>
      </div>
    </div>
  );
}

