'use client';

import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Database, Download, Upload, Trash2, RefreshCw, Calendar } from 'lucide-react';

export default function BackupPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingBackup, setCreatingBackup] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadBackups();
    }
  }, [isAuthenticated]);

  const loadBackups = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const res = await fetch('/api/backup');
      // const data = await res.json();
      
      // Mock data
      setBackups([
        { 
          name: 'backup-2024-01-15.json', 
          timestamp: '2024-01-15T10:30:00Z',
          size: '2.5 MB',
          collections: ['users', 'invoices', 'customers']
        },
        { 
          name: 'backup-2024-01-10.json', 
          timestamp: '2024-01-10T14:20:00Z',
          size: '2.3 MB',
          collections: ['users', 'invoices', 'customers']
        }
      ]);
    } catch (error) {
      console.error('Failed to load backups:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    try {
      setCreatingBackup(true);
      // TODO: Replace with actual API call
      // await fetch('/api/backup', { method: 'POST' });
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate
      loadBackups();
    } catch (error) {
      console.error('Failed to create backup:', error);
    } finally {
      setCreatingBackup(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-full flex flex-col">
      <Header 
        onMenuClick={() => {}}
        title="Backup & Recovery"
        subtitle="Create and manage database backups for your business data"
      />
      
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Backup Management</h2>
            <p className="text-sm text-gray-600">Protect your data with regular backups</p>
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
                Create Backup
              </>
            )}
          </Button>
        </div>

        {/* Backups List */}
        <ModernCard title="Available Backups">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading backups...</p>
            </div>
          ) : backups.length > 0 ? (
            <div className="space-y-3">
              {backups.map((backup, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <Database className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">{backup.name}</p>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(backup.timestamp).toLocaleDateString()}
                        </span>
                        <span>{backup.size}</span>
                        <span>{backup.collections.length} collections</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Upload className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
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

