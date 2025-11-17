'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Input } from '@/components/ui/input';
import { FileCode, Filter } from 'lucide-react';

export default function SystemLogsPage() {
  const [filter, setFilter] = useState('');

  const logs = [
    { id: '1', action: 'Invoice Created', user: 'John Doe', timestamp: '2024-01-15 10:30 AM', type: 'invoice' },
    { id: '2', action: 'Settings Updated', user: 'Jane Smith', timestamp: '2024-01-15 09:15 AM', type: 'settings' },
    { id: '3', action: 'User Login', user: 'John Doe', timestamp: '2024-01-15 08:00 AM', type: 'auth' }
  ];

  return (
    <div className="h-full flex flex-col">
      <Header onMenuClick={() => {}} title="System Logs" subtitle="View system activity and audit logs" showSearch={false} />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <ModernCard title="Activity Logs">
          <div className="mb-4">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Filter logs..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{log.action}</p>
                    <p className="text-sm text-gray-600">{log.user} • {log.timestamp}</p>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {log.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ModernCard>
      </div>
    </div>
  );
}

