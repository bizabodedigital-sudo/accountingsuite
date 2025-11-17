'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { workflowAPI } from '@/lib/api';
import {
  Zap,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  Loader2,
  Search,
  Filter,
  Settings,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Workflow {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  trigger: {
    type: string;
    conditions?: any;
  };
  actions: Array<{
    type: string;
    config: any;
    order: number;
  }>;
  runCount: number;
  successCount: number;
  failureCount: number;
  lastRun?: string;
}

export default function WorkflowsPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState('All');
  const [filterTrigger, setFilterTrigger] = useState('All');

  useEffect(() => {
    loadWorkflows();
  }, [filterActive, filterTrigger]);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterActive !== 'All') {
        params.isActive = filterActive === 'Active';
      }
      if (filterTrigger !== 'All') {
        params.triggerType = filterTrigger;
      }
      const res = await workflowAPI.getWorkflows(params);
      setWorkflows(res.data.data || []);
    } catch (error) {
      console.error('Failed to load workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      await workflowAPI.toggleWorkflow(id);
      loadWorkflows();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to toggle workflow');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this workflow?')) return;
    
    try {
      await workflowAPI.deleteWorkflow(id);
      loadWorkflows();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete workflow');
    }
  };

  const handleTest = async (id: string) => {
    try {
      const result = await workflowAPI.testWorkflow(id, {
        documentType: 'INVOICE',
        documentId: 'test',
        status: 'SENT',
        amount: 1000,
        customerId: 'test'
      });
      alert(`Workflow test completed: ${result.data.success ? 'Success' : 'Failed'}\n${result.data.message}`);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to test workflow');
    }
  };

  const getTriggerLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getActionLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const filteredWorkflows = workflows.filter(w => {
    const matchesSearch = w.name.toLowerCase().includes(search.toLowerCase()) ||
      (w.description && w.description.toLowerCase().includes(search.toLowerCase()));
    return matchesSearch;
  });

  const triggerTypes = [
    'All',
    'INVOICE_CREATED',
    'INVOICE_SENT',
    'INVOICE_PAID',
    'INVOICE_OVERDUE',
    'QUOTE_CREATED',
    'QUOTE_APPROVED',
    'PAYMENT_RECEIVED',
    'EXPENSE_CREATED',
    'CUSTOMER_CREATED',
    'PRODUCT_LOW_STOCK',
    'SCHEDULED'
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header 
        onMenuClick={() => {}}
        title="Automated Workflows"
        subtitle="Create and manage automated business processes"
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Actions Bar */}
          <div className="flex justify-between items-center">
            <div className="flex gap-4 items-center flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search workflows..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <select
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              
              <select
                value={filterTrigger}
                onChange={(e) => setFilterTrigger(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                {triggerTypes.map(type => (
                  <option key={type} value={type}>{getTriggerLabel(type)}</option>
                ))}
              </select>
            </div>
            
            <Button
              onClick={() => router.push('/settings/workflows/create')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Workflow
            </Button>
          </div>

          {/* Workflows List */}
          <ModernCard title="Workflows">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : filteredWorkflows.length === 0 ? (
              <div className="text-center py-12">
                <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">No workflows found</p>
                <Button
                  onClick={() => router.push('/settings/workflows/create')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Workflow
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredWorkflows.map(workflow => (
                  <div
                    key={workflow._id}
                    className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {workflow.name}
                          </h3>
                          {workflow.isActive ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300 rounded-full text-xs font-medium flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-full text-xs font-medium flex items-center gap-1">
                              <XCircle className="w-3 h-3" />
                              Inactive
                            </span>
                          )}
                        </div>
                        
                        {workflow.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            {workflow.description}
                          </p>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Trigger</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {getTriggerLabel(workflow.trigger.type)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Actions</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {workflow.actions.length} action{workflow.actions.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Runs</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {workflow.runCount}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Success Rate</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {workflow.runCount > 0
                                ? Math.round((workflow.successCount / workflow.runCount) * 100)
                                : 0}%
                            </p>
                          </div>
                        </div>

                        {workflow.actions.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Actions:</p>
                            <div className="flex flex-wrap gap-2">
                              {workflow.actions
                                .sort((a, b) => a.order - b.order)
                                .map((action, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-xs"
                                  >
                                    {getActionLabel(action.type)}
                                  </span>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="ml-4 flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTest(workflow._id)}
                          title="Test Workflow"
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggle(workflow._id, workflow.isActive)}
                          title={workflow.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {workflow.isActive ? (
                            <Pause className="w-4 h-4 text-orange-600" />
                          ) : (
                            <Play className="w-4 h-4 text-green-600" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/settings/workflows/${workflow._id}/edit`)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(workflow._id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ModernCard>
        </div>
      </div>
    </div>
  );
}
