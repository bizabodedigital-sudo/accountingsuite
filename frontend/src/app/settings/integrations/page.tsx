'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { integrationAPI } from '@/lib/api';
import { 
  Plug, 
  Plus, 
  Trash2, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Settings2,
  Webhook,
  Key,
  Zap
} from 'lucide-react';

interface Integration {
  _id: string;
  name: string;
  type: 'n8n' | 'zapier' | 'make' | 'webhook' | 'api' | 'custom';
  isActive: boolean;
  isConnected: boolean;
  syncStatus: 'success' | 'failed' | 'pending' | 'never';
  lastSync?: string;
  createdAt: string;
  webhookId?: any;
  apiKeyId?: any;
  config?: any;
}

export default function IntegrationsPage() {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'webhook' as Integration['type'],
    config: {},
    credentials: {}
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadIntegrations();
    }
  }, [isAuthenticated]);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const response = await integrationAPI.getIntegrations({ limit: 100 });
      setIntegrations(response.data.data || []);
    } catch (error) {
      console.error('Failed to load integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIntegration = () => {
    setFormData({
      name: '',
      type: 'webhook',
      config: {},
      credentials: {}
    });
    setEditingIntegration(null);
    setShowAddModal(true);
  };

  const handleEditIntegration = (integration: Integration) => {
    setFormData({
      name: integration.name,
      type: integration.type,
      config: integration.config || {},
      credentials: {}
    });
    setEditingIntegration(integration);
    setShowAddModal(true);
  };

  const handleSaveIntegration = async () => {
    try {
      if (editingIntegration) {
        await integrationAPI.updateIntegration(editingIntegration._id, formData);
      } else {
        await integrationAPI.createIntegration(formData);
      }
      setShowAddModal(false);
      loadIntegrations();
    } catch (error: any) {
      console.error('Failed to save integration:', error);
      alert(error.response?.data?.error || 'Failed to save integration');
    }
  };

  const handleDeleteIntegration = async (id: string) => {
    if (!confirm('Are you sure you want to delete this integration?')) return;
    
    try {
      await integrationAPI.deleteIntegration(id);
      loadIntegrations();
    } catch (error) {
      console.error('Failed to delete integration:', error);
      alert('Failed to delete integration');
    }
  };

  const handleTestIntegration = async (id: string) => {
    try {
      const response = await integrationAPI.testIntegration(id);
      if (response.data.success) {
        alert('Integration test successful!');
      } else {
        alert(`Integration test failed: ${response.data.message}`);
      }
      loadIntegrations();
    } catch (error: any) {
      console.error('Failed to test integration:', error);
      alert(error.response?.data?.error || 'Failed to test integration');
    }
  };

  const getTypeIcon = (type: Integration['type']) => {
    switch (type) {
      case 'webhook':
        return <Webhook className="w-5 h-5" />;
      case 'api':
        return <Key className="w-5 h-5" />;
      case 'zapier':
      case 'n8n':
      case 'make':
        return <Zap className="w-5 h-5" />;
      default:
        return <Plug className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (integration: Integration) => {
    if (!integration.isActive) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
          Inactive
        </span>
      );
    }
    
    if (integration.isConnected && integration.syncStatus === 'success') {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Connected
        </span>
      );
    }
    
    if (integration.syncStatus === 'failed') {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Failed
        </span>
      );
    }
    
    if (integration.syncStatus === 'pending') {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Syncing
        </span>
      );
    }
    
    return (
      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
        Not Connected
      </span>
    );
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
        title="Integrations"
        subtitle="Connect with third-party services and automation tools"
        showSearch={false}
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Add Integration Button */}
        <div className="flex justify-end">
          <Button onClick={handleAddIntegration} className="bg-gradient-to-r from-blue-600 to-purple-600">
            <Plus className="w-4 h-4 mr-2" />
            Add Integration
          </Button>
        </div>

        {/* Integrations List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading integrations...</p>
          </div>
        ) : integrations.length === 0 ? (
          <ModernCard>
            <div className="text-center py-12">
              <Plug className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No Integrations
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Connect your accounting suite with third-party services and automation tools
              </p>
              <Button onClick={handleAddIntegration} className="bg-gradient-to-r from-blue-600 to-purple-600">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Integration
              </Button>
            </div>
          </ModernCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((integration) => (
              <ModernCard key={integration._id} className="hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white">
                      {getTypeIcon(integration.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {integration.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {integration.type}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  {getStatusBadge(integration)}
                </div>

                {integration.lastSync && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    Last sync: {new Date(integration.lastSync).toLocaleString()}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestIntegration(integration._id)}
                    className="flex-1"
                  >
                    <TestTube className="w-4 h-4 mr-1" />
                    Test
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditIntegration(integration)}
                    className="flex-1"
                  >
                    <Settings2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteIntegration(integration._id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </ModernCard>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {editingIntegration ? 'Edit Integration' : 'Add Integration'}
            </h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Integration Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Zapier Webhook"
                />
              </div>

              <div>
                <Label htmlFor="type">Integration Type</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Integration['type'] })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="webhook">Webhook</option>
                  <option value="api">API</option>
                  <option value="zapier">Zapier</option>
                  <option value="n8n">n8n</option>
                  <option value="make">Make (Integromat)</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveIntegration}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                  disabled={!formData.name.trim()}
                >
                  {editingIntegration ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

