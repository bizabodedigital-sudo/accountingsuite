'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings2, Key, Webhook, ToggleLeft } from 'lucide-react';

export default function AdvancedSettingsPage() {
  const [formData, setFormData] = useState({
    apiKey: '',
    webhookUrl: '',
    enableInventory: true,
    enableMultiCurrency: true,
    enableProjects: false
  });

  return (
    <div className="h-full flex flex-col">
      <Header onMenuClick={() => {}} title="Advanced Settings" subtitle="Developer options and feature toggles" showSearch={false} />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <ModernCard title="Developer Options">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder="Generate API key"
              />
              <Button variant="outline" size="sm">
                <Key className="w-4 h-4 mr-2" />
                Generate New Key
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="webhookUrl">Webhook Endpoint</Label>
              <Input
                id="webhookUrl"
                value={formData.webhookUrl}
                onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                placeholder="https://your-webhook-url.com"
              />
            </div>
          </div>
        </ModernCard>

        <ModernCard title="Feature Toggles">
          <div className="space-y-3">
            {[
              { key: 'enableInventory', label: 'Inventory Management' },
              { key: 'enableMultiCurrency', label: 'Multi-Currency' },
              { key: 'enableProjects', label: 'Projects Module' }
            ].map((feature) => (
              <div key={feature.key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <span>{feature.label}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData[feature.key as keyof typeof formData] as boolean}
                    onChange={(e) => setFormData({ ...formData, [feature.key]: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </ModernCard>

        <ModernCard title="Security">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Password Policy</Label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option>Standard (6+ characters)</option>
                <option>Strong (8+ characters, mixed case, numbers)</option>
                <option>Very Strong (12+ characters, special chars)</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label>Session Timeout (minutes)</Label>
              <Input type="number" placeholder="60" />
            </div>
          </div>
        </ModernCard>
      </div>
    </div>
  );
}

