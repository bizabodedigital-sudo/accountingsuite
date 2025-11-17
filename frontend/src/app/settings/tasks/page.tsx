'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckSquare, Save } from 'lucide-react';

export default function TaskSettingsPage() {
  const [formData, setFormData] = useState({
    defaultTaskRate: 0,
    defaultProject: '',
    timesheetRounding: 'none',
    taskStatuses: ['To Do', 'In Progress', 'Completed']
  });

  return (
    <div className="h-full flex flex-col">
      <Header onMenuClick={() => {}} title="Task Settings" subtitle="Configure task and timesheet defaults" showSearch={false} />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <ModernCard title="Task Defaults">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="defaultTaskRate">Default Task Rate (Hourly)</Label>
              <Input
                id="defaultTaskRate"
                type="number"
                value={formData.defaultTaskRate}
                onChange={(e) => setFormData({ ...formData, defaultTaskRate: parseFloat(e.target.value) })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timesheetRounding">Timesheet Rounding</Label>
              <select
                id="timesheetRounding"
                value={formData.timesheetRounding}
                onChange={(e) => setFormData({ ...formData, timesheetRounding: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="none">No Rounding</option>
                <option value="15min">15 minutes</option>
                <option value="30min">30 minutes</option>
                <option value="1hour">1 hour</option>
              </select>
            </div>
          </div>
        </ModernCard>
      </div>
    </div>
  );
}

