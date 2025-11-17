'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Save, Send } from 'lucide-react';
import { settingsAPI } from '@/lib/api';

export default function EmailSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    fromName: '',
    fromEmail: '',
    replyTo: ''
  });

  useEffect(() => {
    const loadEmailSettings = async () => {
      try {
        setLoading(true);
        const response = await settingsAPI.getAllSettings();
        const emailSettings = response.data?.data?.settings?.emailSettings || {};
        
        setFormData(prev => ({
          ...prev,
          smtpHost: emailSettings.smtpHost || '',
          smtpPort: emailSettings.smtpPort || 587,
          smtpUser: emailSettings.smtpUser || '',
          smtpPass: emailSettings.smtpPass || '',
          fromName: emailSettings.fromName || '',
          fromEmail: emailSettings.fromEmail || '',
          replyTo: emailSettings.replyTo || ''
        }));
      } catch (error) {
        console.error('Failed to load email settings:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadEmailSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await settingsAPI.updateEmailSettings(formData);
      alert('Email settings saved successfully!');
    } catch (error: any) {
      console.error('Failed to save:', error);
      alert(error.response?.data?.error || 'Failed to save email settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Header onMenuClick={() => {}} title="Email Settings" subtitle="Configure SMTP and email preferences" showSearch={false} />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <ModernCard title="SMTP Configuration">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="smtpHost">SMTP Host</Label>
              <Input
                id="smtpHost"
                value={formData.smtpHost}
                onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                placeholder="smtp.gmail.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="smtpPort">SMTP Port</Label>
              <Input
                id="smtpPort"
                type="number"
                value={formData.smtpPort}
                onChange={(e) => setFormData({ ...formData, smtpPort: parseInt(e.target.value) })}
                placeholder="587"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="smtpUser">SMTP Username</Label>
              <Input
                id="smtpUser"
                value={formData.smtpUser}
                onChange={(e) => setFormData({ ...formData, smtpUser: e.target.value })}
                placeholder="your-email@gmail.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="smtpPass">SMTP Password</Label>
              <Input
                id="smtpPass"
                type="password"
                value={formData.smtpPass}
                onChange={(e) => setFormData({ ...formData, smtpPass: e.target.value })}
                placeholder="••••••••"
              />
            </div>
          </div>
        </ModernCard>

        <ModernCard title="Email Preferences">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fromName">From Name</Label>
              <Input
                id="fromName"
                value={formData.fromName}
                onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                placeholder="Your Company Name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fromEmail">From Email</Label>
              <Input
                id="fromEmail"
                type="email"
                value={formData.fromEmail}
                onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                placeholder="noreply@yourcompany.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="replyTo">Reply-To Address</Label>
              <Input
                id="replyTo"
                type="email"
                value={formData.replyTo}
                onChange={(e) => setFormData({ ...formData, replyTo: e.target.value })}
                placeholder="support@yourcompany.com"
              />
            </div>
          </div>
        </ModernCard>

        <div className="flex justify-end space-x-3">
          <Button variant="outline">
            <Send className="w-4 h-4 mr-2" />
            Test Email
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}

