'use client';

import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { Database, Download, Upload, Trash2, RefreshCw, Calendar, Clock } from 'lucide-react';
import { backupAPI } from '@/lib/api';

export default function BackupSettingsPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [schedule, setSchedule] = useState({
    enabled: false,
    frequency: 'daily',
    time: '02:00'
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadBackups();
    }
  }, [isAuthenticated]);

  const loadBackups = async () => {
    try {
      setLoading(true);
      const response = await backupAPI.getBackups();
      setBackups(response.data?.data || []);
    } catch (error) {
      console.error('Failed to load backups:', error);
      setBackups([]);
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    try {
      setCreatingBackup(true);
      await backupAPI.createBackup();
      await loadBackups();
      alert('Backup created successfully!');
    } catch (error: any) {
      console.error('Failed to create backup:', error);
      alert(error.response?.data?.error || 'Failed to create backup');
    } finally {
      setCreatingBackup(false);
    }
  };

  const downloadBackup = async (backupId: string) => {
    try {
      const response = await backupAPI.downloadBackup(backupId);
      const blob = new Blob([JSON.stringify(response.data)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download backup:', error);
      alert('Failed to download backup');
    }
  };

  const restoreBackup = async (backupId: string) => {
    if (!confirm('Are you sure you want to restore this backup? This will overwrite current data.')) {
      return;
    }
    try {
      await backupAPI.restoreBackup(backupId);
      alert('Backup restored successfully!');
      window.location.reload();
    } catch (error: any) {
      console.error('Failed to restore backup:', error);
      alert(error.response?.data?.error || 'Failed to restore backup');
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Header 
        onMenuClick={() => {}}
        title="Backup | Restore"
        subtitle="Create and manage database backups for your business data"
        showSearch={false}
      />
      
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Manual Backup */}
        <ModernCard title="Manual Backup">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-2">Create a backup of your current database</p>
              <p className="text-sm text-gray-500">Last backup: {backups[0] ? new Date(backups[0].createdAt || backups[0].timestamp).toLocaleString() : 'Never'}</p>
            </div>
            <Button onClick={createBackup} disabled={creatingBackup}>
              {creatingBackup ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Create Backup Now
                </>
              )}
            </Button>
          </div>
        </ModernCard>

        {/* Backup Schedule */}
        <ModernCard title="Backup Schedule">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium">Enable Scheduled Backups</h4>
                <p className="text-sm text-gray-600">Automatically create backups on a schedule</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={schedule.enabled}
                  onChange={(e) => setSchedule({ ...schedule, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            {schedule.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Frequency</label>
                  <select
                    value={schedule.frequency}
                    onChange={(e) => setSchedule({ ...schedule, frequency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Time</label>
                  <input
                    type="time"
                    value={schedule.time}
                    onChange={(e) => setSchedule({ ...schedule, time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            )}
          </div>
        </ModernCard>

        {/* Available Backups */}
        <ModernCard title="Available Backups">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading backups...</p>
            </div>
          ) : backups.length > 0 ? (
            <div className="space-y-3">
              {backups.map((backup, index) => (
                <div key={backup._id || index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div className="flex items-center space-x-4">
                    <Database className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{backup.filename || backup.name || `Backup ${index + 1}`}</p>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(backup.createdAt || backup.timestamp).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(backup.createdAt || backup.timestamp).toLocaleTimeString()}
                        </span>
                        {backup.size && <span>{backup.size}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => downloadBackup(backup._id || backup.id)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => restoreBackup(backup._id || backup.id)}
                      className="text-orange-600 hover:text-orange-700"
                    >
                      <Upload className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No backups found</p>
              <Button onClick={createBackup} disabled={creatingBackup}>
                <Database className="w-4 h-4 mr-2" />
                Create Your First Backup
              </Button>
            </div>
          )}
        </ModernCard>
      </div>
    </div>
  );
}

