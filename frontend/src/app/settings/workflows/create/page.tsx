'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { workflowAPI } from '@/lib/api';
import { Loader2, Save, X, Plus, Trash2 } from 'lucide-react';

export default function CreateWorkflowPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    trigger: {
      type: 'INVOICE_CREATED',
      conditions: {}
    },
    actions: []
  });

  const [newAction, setNewAction] = useState({
    type: 'SEND_EMAIL',
    config: {}
  });

  const triggerTypes = [
    { value: 'INVOICE_CREATED', label: 'Invoice Created' },
    { value: 'INVOICE_SENT', label: 'Invoice Sent' },
    { value: 'INVOICE_PAID', label: 'Invoice Paid' },
    { value: 'INVOICE_OVERDUE', label: 'Invoice Overdue' },
    { value: 'QUOTE_CREATED', label: 'Quote Created' },
    { value: 'QUOTE_APPROVED', label: 'Quote Approved' },
    { value: 'PAYMENT_RECEIVED', label: 'Payment Received' },
    { value: 'EXPENSE_CREATED', label: 'Expense Created' },
    { value: 'CUSTOMER_CREATED', label: 'Customer Created' },
    { value: 'PRODUCT_LOW_STOCK', label: 'Product Low Stock' },
    { value: 'SCHEDULED', label: 'Scheduled' },
  ];

  const actionTypes = [
    { value: 'SEND_EMAIL', label: 'Send Email' },
    { value: 'SEND_SMS', label: 'Send SMS' },
    { value: 'CREATE_TASK', label: 'Create Task' },
    { value: 'UPDATE_STATUS', label: 'Update Status' },
    { value: 'WEBHOOK', label: 'Call Webhook' },
    { value: 'DELAY', label: 'Delay' },
  ];

  const handleAddAction = () => {
    const actionConfig: any = {};
    
    switch (newAction.type) {
      case 'SEND_EMAIL':
        actionConfig.to = '{{customer.email}}';
        actionConfig.subject = 'Invoice {{invoice.number}}';
        actionConfig.template = 'invoice_reminder';
        break;
      case 'SEND_SMS':
        actionConfig.to = '{{customer.phone}}';
        actionConfig.message = 'Your invoice {{invoice.number}} is due';
        break;
      case 'CREATE_TASK':
        actionConfig.title = 'Follow up on invoice {{invoice.number}}';
        actionConfig.assignTo = '';
        break;
      case 'UPDATE_STATUS':
        actionConfig.status = 'APPROVED';
        break;
      case 'WEBHOOK':
        actionConfig.url = 'https://example.com/webhook';
        actionConfig.method = 'POST';
        actionConfig.headers = {};
        actionConfig.body = {};
        break;
      case 'DELAY':
        actionConfig.duration = 3600; // seconds
        break;
    }

    setFormData({
      ...formData,
      actions: [
        ...formData.actions,
        {
          type: newAction.type,
          config: actionConfig,
          order: formData.actions.length
        }
      ]
    });

    setNewAction({ type: 'SEND_EMAIL', config: {} });
  };

  const handleRemoveAction = (index: number) => {
    setFormData({
      ...formData,
      actions: formData.actions.filter((_, i) => i !== index)
    });
  };

  const handleUpdateAction = (index: number, field: string, value: any) => {
    const updatedActions = [...formData.actions];
    updatedActions[index] = {
      ...updatedActions[index],
      config: {
        ...updatedActions[index].config,
        [field]: value
      }
    };
    setFormData({ ...formData, actions: updatedActions });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || formData.actions.length === 0) {
      alert('Please provide a workflow name and at least one action');
      return;
    }

    try {
      setSaving(true);
      await workflowAPI.createWorkflow(formData);
      router.push('/settings/workflows');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create workflow');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header 
        onMenuClick={() => {}}
        title="Create Workflow"
        subtitle="Automate your business processes"
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <ModernCard title="Workflow Details">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name">Workflow Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-2"
                  required
                  placeholder="e.g., Send Invoice Reminder"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full mt-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  rows={3}
                  placeholder="Describe what this workflow does..."
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Trigger</h3>
                
                <div>
                  <Label htmlFor="triggerType">When should this workflow run? *</Label>
                  <select
                    id="triggerType"
                    value={formData.trigger.type}
                    onChange={(e) => setFormData({
                      ...formData,
                      trigger: { ...formData.trigger, type: e.target.value }
                    })}
                    className="w-full mt-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  >
                    {triggerTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Actions</h3>
                
                {formData.actions.length > 0 && (
                  <div className="space-y-4 mb-4">
                    {formData.actions.map((action, index) => (
                      <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {actionTypes.find(t => t.value === action.type)?.label || action.type}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Action {index + 1}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveAction(index)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>

                        {action.type === 'SEND_EMAIL' && (
                          <div className="space-y-2">
                            <div>
                              <Label className="text-xs">To</Label>
                              <Input
                                value={action.config.to || ''}
                                onChange={(e) => handleUpdateAction(index, 'to', e.target.value)}
                                className="mt-1 text-sm"
                                placeholder="{{customer.email}}"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Subject</Label>
                              <Input
                                value={action.config.subject || ''}
                                onChange={(e) => handleUpdateAction(index, 'subject', e.target.value)}
                                className="mt-1 text-sm"
                                placeholder="Invoice {{invoice.number}}"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Template</Label>
                              <Input
                                value={action.config.template || ''}
                                onChange={(e) => handleUpdateAction(index, 'template', e.target.value)}
                                className="mt-1 text-sm"
                                placeholder="invoice_reminder"
                              />
                            </div>
                          </div>
                        )}

                        {action.type === 'WEBHOOK' && (
                          <div className="space-y-2">
                            <div>
                              <Label className="text-xs">URL</Label>
                              <Input
                                value={action.config.url || ''}
                                onChange={(e) => handleUpdateAction(index, 'url', e.target.value)}
                                className="mt-1 text-sm"
                                placeholder="https://example.com/webhook"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Method</Label>
                              <select
                                value={action.config.method || 'POST'}
                                onChange={(e) => handleUpdateAction(index, 'method', e.target.value)}
                                className="w-full mt-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              >
                                <option value="POST">POST</option>
                                <option value="GET">GET</option>
                                <option value="PUT">PUT</option>
                                <option value="PATCH">PATCH</option>
                              </select>
                            </div>
                          </div>
                        )}

                        {action.type === 'UPDATE_STATUS' && (
                          <div>
                            <Label className="text-xs">New Status</Label>
                            <Input
                              value={action.config.status || ''}
                              onChange={(e) => handleUpdateAction(index, 'status', e.target.value)}
                              className="mt-1 text-sm"
                              placeholder="APPROVED"
                            />
                          </div>
                        )}

                        {action.type === 'DELAY' && (
                          <div>
                            <Label className="text-xs">Duration (seconds)</Label>
                            <Input
                              type="number"
                              value={action.config.duration || ''}
                              onChange={(e) => handleUpdateAction(index, 'duration', parseInt(e.target.value) || 0)}
                              className="mt-1 text-sm"
                              placeholder="3600"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <Label className="text-xs">Add Action</Label>
                      <select
                        value={newAction.type}
                        onChange={(e) => setNewAction({ ...newAction, type: e.target.value })}
                        className="w-full mt-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        {actionTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                    <Button
                      type="button"
                      onClick={handleAddAction}
                      variant="outline"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Action
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isActive">Workflow is active</Label>
              </div>

              <div className="flex gap-4 justify-end pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving || !formData.name || formData.actions.length === 0}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Create Workflow
                    </>
                  )}
                </Button>
              </div>
            </form>
          </ModernCard>
        </div>
      </div>
    </div>
  );
}



