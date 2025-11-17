'use client';

import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { FileText, Lock, Palette } from 'lucide-react';

export default function InvoiceDesignPage() {
  return (
    <div className="h-full flex flex-col">
      <Header onMenuClick={() => {}} title="Invoice Design" subtitle="Customize invoice templates and branding" showSearch={false} />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <ModernCard title="Invoice Themes" className="relative">
          <div className="absolute top-4 right-4">
            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs flex items-center">
              <Lock className="w-3 h-3 mr-1" />
              Pro Feature
            </span>
          </div>
          <p className="text-gray-600 mb-4">Choose from professional invoice templates</p>
          <Button disabled>
            <Palette className="w-4 h-4 mr-2" />
            Select Theme
          </Button>
        </ModernCard>

        <ModernCard title="Branding">
          <p className="text-gray-600 mb-4">Customize logo, colors, and layout</p>
          <div className="space-y-4">
            <Button variant="outline" disabled>
              Upload Logo
            </Button>
            <Button variant="outline" disabled>
              Customize Colors
            </Button>
          </div>
        </ModernCard>
      </div>
    </div>
  );
}

