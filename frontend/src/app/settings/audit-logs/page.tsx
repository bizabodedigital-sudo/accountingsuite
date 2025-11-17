'use client';

import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Search, Filter, Calendar, User, Activity } from 'lucide-react';
import { auditLogAPI } from '@/lib/api';

export default function AuditLogsPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadLogs();
    }
  }, [isAuthenticated, actionFilter]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (actionFilter !== 'all') {
        params.action = actionFilter;
      }
      const response = await auditLogAPI.getAuditLogs(params);
      setLogs(response.data.data || []);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'text-green-600 dark:text-green-400';
    if (action.includes('UPDATE')) return 'text-blue-600 dark:text-blue-400';
    if (action.includes('DELETE')) return 'text-red-600 dark:text-red-400';
    if (action.includes('LOGIN')) return 'text-purple-600 dark:text-purple-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading audit logs...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        title="Audit Logs"
        subtitle="View system activity and changes"
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Actions Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-1 gap-2 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search audit logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Actions</option>
              <option value="LOGIN">Login</option>
              <option value="INVOICE_CREATED">Invoice Created</option>
              <option value="INVOICE_UPDATED">Invoice Updated</option>
              <option value="PAYMENT_CREATED">Payment Created</option>
              <option value="QUOTE_CREATED">Quote Created</option>
            </select>
          </div>
        </div>

        {/* Logs List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading audit logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <ModernCard className="p-12 text-center">
            <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No audit logs found</h3>
            <p className="text-gray-600 dark:text-gray-400">Activity logs will appear here</p>
          </ModernCard>
        ) : (
          <div className="grid gap-4">
            {filteredLogs.map((log) => (
              <ModernCard key={log._id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Activity className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <span className={`font-semibold ${getActionColor(log.action)}`}>
                        {log.action?.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {log.entityType}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{log.userEmail || 'System'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>{' '}
                        <span className={log.status === 'SUCCESS' ? 'text-green-600' : 'text-red-600'}>
                          {log.status}
                        </span>
                      </div>
                      {log.ipAddress && (
                        <div>
                          <span className="font-medium">IP:</span> {log.ipAddress}
                        </div>
                      )}
                    </div>
                    {log.changes && Object.keys(log.changes).length > 0 && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                        <div className="font-medium mb-1">Changes:</div>
                        {Object.entries(log.changes).map(([key, value]: [string, any]) => (
                          <div key={key} className="text-gray-600 dark:text-gray-400">
                            <span className="font-medium">{key}:</span> {JSON.stringify(value)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </ModernCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

