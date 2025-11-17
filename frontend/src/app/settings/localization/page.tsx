'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Globe, Save, Calendar, DollarSign } from 'lucide-react';
import { settingsAPI } from '@/lib/api';

export default function LocalizationPage() {
  const { tenant } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    country: 'Jamaica',
    timezone: 'America/Jamaica',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: '1,000.00',
    fiscalYearStartMonth: '1',
    weekStart: 'Sunday',
    defaultLanguage: 'en',
    enabledLanguages: ['en']
  });

  useEffect(() => {
    const loadLocalization = async () => {
      try {
        setLoading(true);
        const response = await settingsAPI.getAllSettings();
        const settings = response.data?.data?.settings || {};
        const tenantData = response.data?.data?.tenant || {};
        
        setFormData(prev => ({
          ...prev,
          country: 'Jamaica',
          timezone: settings.timezone || 'America/Jamaica',
          dateFormat: tenantData.dateFormat || tenant?.dateFormat || 'DD/MM/YYYY',
          numberFormat: settings.numberFormat || '1,000.00',
          fiscalYearStartMonth: String(settings.fiscalYearStartMonth || 1),
          weekStart: settings.weekStart || 'Sunday',
          defaultLanguage: settings.defaultLanguage || 'en'
        }));
      } catch (error) {
        console.error('Failed to load localization:', error);
        if (tenant) {
          setFormData(prev => ({
            ...prev,
            dateFormat: tenant.dateFormat || 'DD/MM/YYYY',
            timezone: tenant.settings?.timezone || 'America/Jamaica'
          }));
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadLocalization();
  }, [tenant]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await settingsAPI.updateLocalizationSettings({
        timezone: formData.timezone,
        numberFormat: formData.numberFormat,
        fiscalYearStartMonth: parseInt(formData.fiscalYearStartMonth),
        weekStart: formData.weekStart,
        defaultLanguage: formData.defaultLanguage,
        dateFormat: formData.dateFormat
      });
      alert('Localization settings saved successfully!');
    } catch (error: any) {
      console.error('Failed to save:', error);
      alert(error.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Header
        onMenuClick={() => {}}
        title="Localization"
        subtitle="Configure regional and language settings"
        showSearch={false}
      />
      
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <ModernCard title="Regional Settings">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <select
                id="timezone"
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="America/Jamaica">America/Jamaica (EST)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dateFormat">Date Format</Label>
              <select
                id="dateFormat"
                value={formData.dateFormat}
                onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="numberFormat">Number Format</Label>
              <select
                id="numberFormat"
                value={formData.numberFormat}
                onChange={(e) => setFormData({ ...formData, numberFormat: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="1,000.00">1,000.00 (US Style)</option>
                <option value="1.000,00">1.000,00 (EU Style)</option>
                <option value="1 000.00">1 000.00 (Space Separator)</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fiscalYearStartMonth">Fiscal Year Start Month</Label>
              <select
                id="fiscalYearStartMonth"
                value={formData.fiscalYearStartMonth}
                onChange={(e) => setFormData({ ...formData, fiscalYearStartMonth: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month, index) => (
                  <option key={index} value={index + 1}>{month}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="weekStart">Week Start</Label>
              <select
                id="weekStart"
                value={formData.weekStart}
                onChange={(e) => setFormData({ ...formData, weekStart: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="Sunday">Sunday</option>
                <option value="Monday">Monday</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="defaultLanguage">Default Language</Label>
              <select
                id="defaultLanguage"
                value={formData.defaultLanguage}
                onChange={(e) => setFormData({ ...formData, defaultLanguage: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
              </select>
            </div>
          </div>
        </ModernCard>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}

