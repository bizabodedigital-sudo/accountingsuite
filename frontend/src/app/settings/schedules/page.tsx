'use client';

import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Clock, Plus } from 'lucide-react';

export default function SchedulesPage() {
  return (
    <div className="h-full flex flex-col">
      <Header onMenuClick={() => {}} title="Schedules" subtitle="Manage scheduled invoices and reports" showSearch={false} />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <ModernCard title="Scheduled Invoices">
          <p className="text-gray-600 mb-4">Recurring invoices and schedules</p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Schedule
          </Button>
        </ModernCard>

        <ModernCard title="Scheduled Reports">
          <p className="text-gray-600 mb-4">Automated report generation and delivery</p>
          <Button variant="outline">
            <Clock className="w-4 h-4 mr-2" />
            Schedule Report
          </Button>
        </ModernCard>
      </div>
    </div>
  );
}

