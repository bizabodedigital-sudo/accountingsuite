'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Mail, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  Eye,
  Send,
  Loader2,
  FileText
} from 'lucide-react';
import { settingsAPI, paymentReminderAPI } from '@/lib/api';

interface EmailTemplate {
  _id?: string;
  name: string;
  type: string;
  subject: string;
  body: string;
  isActive: boolean;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // Template form state
  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState('INVOICE_REMINDER');
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateBody, setTemplateBody] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Reminder settings
  const [autoReminderEnabled, setAutoReminderEnabled] = useState(false);
  const [daysBeforeDue, setDaysBeforeDue] = useState(3);
  const [reminderFrequency, setReminderFrequency] = useState('DAILY');

  useEffect(() => {
    loadTemplates();
    loadReminderSettings();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call when backend is ready
      // For now, use default templates
      const defaultTemplates: EmailTemplate[] = [
        {
          _id: '1',
          name: 'First Payment Reminder',
          type: 'INVOICE_REMINDER',
          subject: 'Payment Reminder: Invoice {{invoiceNumber}}',
          body: `Dear {{customerName}},

This is a friendly reminder that invoice {{invoiceNumber}} for {{invoiceAmount}} is due on {{dueDate}}.

Please make payment at your earliest convenience.

Thank you for your business!`,
          isActive: true
        },
        {
          _id: '2',
          name: 'Overdue Notice',
          type: 'OVERDUE_NOTICE',
          subject: 'Overdue Invoice: {{invoiceNumber}}',
          body: `Dear {{customerName}},

Invoice {{invoiceNumber}} for {{invoiceAmount}} is now {{daysOverdue}} days overdue.

Please arrange payment immediately to avoid any service interruptions.

Thank you.`,
          isActive: true
        },
        {
          _id: '3',
          name: 'Final Notice',
          type: 'FINAL_NOTICE',
          subject: 'Final Notice: Invoice {{invoiceNumber}}',
          body: `Dear {{customerName}},

This is a final notice regarding invoice {{invoiceNumber}} for {{invoiceAmount}}, which is {{daysOverdue}} days overdue.

Please contact us immediately to resolve this matter.

Thank you.`,
          isActive: true
        }
      ];
      setTemplates(defaultTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReminderSettings = async () => {
    try {
      // TODO: Load from settings API
      setAutoReminderEnabled(false);
      setDaysBeforeDue(3);
      setReminderFrequency('DAILY');
    } catch (error) {
      console.error('Failed to load reminder settings:', error);
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateType(template.type);
    setTemplateSubject(template.subject);
    setTemplateBody(template.body);
    setIsActive(template.isActive);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const templateData: EmailTemplate = {
        name: templateName,
        type: templateType,
        subject: templateSubject,
        body: templateBody,
        isActive
      };

      if (editingTemplate?._id) {
        // Update existing
        const updated = templates.map(t => 
          t._id === editingTemplate._id ? { ...templateData, _id: editingTemplate._id } : t
        );
        setTemplates(updated);
      } else {
        // Create new
        const newTemplate = { ...templateData, _id: Date.now().toString() };
        setTemplates([...templates, newTemplate]);
      }

      // TODO: Save to backend API
      setEditingTemplate(null);
      resetForm();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Delete this template?')) return;
    
    setTemplates(templates.filter(t => t._id !== templateId));
    // TODO: Delete from backend API
  };

  const resetForm = () => {
    setTemplateName('');
    setTemplateType('INVOICE_REMINDER');
    setTemplateSubject('');
    setTemplateBody('');
    setIsActive(true);
  };

  const handleSaveReminderSettings = async () => {
    try {
      setSaving(true);
      // TODO: Save to settings API
      await settingsAPI.updateWorkflowSettings({
        autoSendReminderDaysBeforeDue: autoReminderEnabled ? daysBeforeDue : 0,
        reminderFrequency
      });
      alert('Reminder settings saved successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to save reminder settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestReminder = async () => {
    try {
      // TODO: Send test reminder
      alert('Test reminder sent! Check your email.');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to send test reminder');
    }
  };

  const previewBody = templateBody
    .replace(/\{\{invoiceNumber\}\}/g, 'INV-001')
    .replace(/\{\{customerName\}\}/g, 'John Doe')
    .replace(/\{\{invoiceAmount\}\}/g, '$1,500.00')
    .replace(/\{\{dueDate\}\}/g, new Date().toLocaleDateString())
    .replace(/\{\{daysOverdue\}\}/g, '5');

  const previewSubject = templateSubject
    .replace(/\{\{invoiceNumber\}\}/g, 'INV-001')
    .replace(/\{\{daysOverdue\}\}/g, '5');

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header 
        onMenuClick={() => {}}
        title="Email Templates & Reminders"
        subtitle="Manage email templates and automated payment reminders"
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Email Templates */}
          <ModernCard title="Email Templates">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Create and manage email templates for invoices and reminders
                </p>
                <Button
                  onClick={() => {
                    resetForm();
                    setEditingTemplate(null);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Template
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map(template => (
                  <div
                    key={template._id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {template.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {template.type.replace('_', ' ')}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(template)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(template._id!)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {template.subject}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      {template.isActive ? (
                        <span className="text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                          Active
                        </span>
                      ) : (
                        <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ModernCard>

          {/* Template Editor */}
          {editingTemplate !== undefined && (
            <ModernCard title={editingTemplate ? 'Edit Template' : 'New Template'}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="templateName">Template Name *</Label>
                    <Input
                      id="templateName"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      className="mt-2"
                      placeholder="e.g., First Payment Reminder"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="templateType">Template Type *</Label>
                    <select
                      id="templateType"
                      value={templateType}
                      onChange={(e) => setTemplateType(e.target.value)}
                      className="w-full mt-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      required
                    >
                      <option value="INVOICE_REMINDER">Invoice Reminder</option>
                      <option value="OVERDUE_NOTICE">Overdue Notice</option>
                      <option value="FINAL_NOTICE">Final Notice</option>
                      <option value="PAYMENT_RECEIVED">Payment Received</option>
                      <option value="INVOICE_SENT">Invoice Sent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="templateSubject">Email Subject *</Label>
                  <Input
                    id="templateSubject"
                    value={templateSubject}
                    onChange={(e) => setTemplateSubject(e.target.value)}
                    className="mt-2"
                    placeholder="e.g., Payment Reminder: Invoice {{invoiceNumber}}"
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Available variables: {'{{invoiceNumber}}'}, {'{{customerName}}'}, {'{{invoiceAmount}}'}, {'{{dueDate}}'}, {'{{daysOverdue}}'}
                  </p>
                </div>

                <div>
                  <Label htmlFor="templateBody">Email Body *</Label>
                  <textarea
                    id="templateBody"
                    value={templateBody}
                    onChange={(e) => setTemplateBody(e.target.value)}
                    rows={10}
                    className="w-full mt-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm"
                    placeholder="Enter email body text..."
                    required
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="isActive">Template is active</Label>
                </div>

                <div className="flex gap-4 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingTemplate(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving || !templateName || !templateSubject || !templateBody}
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
                        Save Template
                      </>
                    )}
                  </Button>
                </div>

                {showPreview && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold mb-2">Preview</h4>
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Subject:</span>
                        <p className="font-medium">{previewSubject || '(No subject)'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Body:</span>
                        <div className="mt-1 p-3 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 whitespace-pre-wrap">
                          {previewBody || '(No body)'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ModernCard>
          )}

          {/* Automated Reminders Settings */}
          <ModernCard title="Automated Payment Reminders">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    Enable Automated Reminders
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Automatically send payment reminders before invoices are due
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoReminderEnabled}
                    onChange={(e) => setAutoReminderEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {autoReminderEnabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="daysBeforeDue">Days Before Due Date</Label>
                    <Input
                      id="daysBeforeDue"
                      type="number"
                      min="1"
                      value={daysBeforeDue}
                      onChange={(e) => setDaysBeforeDue(parseInt(e.target.value) || 3)}
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Send reminder this many days before the invoice due date
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="reminderFrequency">Reminder Frequency</Label>
                    <select
                      id="reminderFrequency"
                      value={reminderFrequency}
                      onChange={(e) => setReminderFrequency(e.target.value)}
                      className="w-full mt-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="MONTHLY">Monthly</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex gap-4 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleTestReminder}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Test Reminder
                </Button>
                <Button
                  onClick={handleSaveReminderSettings}
                  disabled={saving}
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
                      Save Settings
                    </>
                  )}
                </Button>
              </div>
            </div>
          </ModernCard>
        </div>
      </div>
    </div>
  );
}
