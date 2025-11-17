'use client';

import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Download, Upload, FileSpreadsheet } from 'lucide-react';

export default function ImportExportPage() {
  return (
    <div className="h-full flex flex-col">
      <Header onMenuClick={() => {}} title="Import | Export" subtitle="Import and export your business data" showSearch={false} />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <ModernCard title="Export Data">
          <p className="text-gray-600 mb-4">Export your data in various formats</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Clients (CSV)
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Products (CSV)
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Invoices (CSV)
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Expenses (CSV)
            </Button>
            <Button variant="outline">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export Trial Balance
            </Button>
            <Button variant="outline">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export P&L Statement
            </Button>
          </div>
        </ModernCard>

        <ModernCard title="Import Data">
          <p className="text-gray-600 mb-4">Import data from CSV or Excel files</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Import Clients
            </Button>
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Import Products
            </Button>
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Import Invoices
            </Button>
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Import Expenses
            </Button>
          </div>
        </ModernCard>
      </div>
    </div>
  );
}

