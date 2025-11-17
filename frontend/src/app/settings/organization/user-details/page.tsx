'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Save, Shield, Clock, Globe } from 'lucide-react';
import { settingsAPI } from '@/lib/api';

export default function UserDetailsPage() {
  const { user, tenant } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.role || 'STAFF',
    timezone: 'America/Jamaica',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: '1,000.00',
    defaultDashboard: 'overview',
    twoFactorEnabled: false
  });

  useEffect(() => {
    const loadUserDetails = async () => {
      try {
        setLoading(true);
        const response = await settingsAPI.getAllSettings();
        const settings = response.data?.data?.settings || {};
        
        setFormData(prev => ({
          ...prev,
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          email: user?.email || '',
          phone: user?.phone || '',
          timezone: settings.timezone || 'America/Jamaica',
          dateFormat: response.data?.data?.tenant?.dateFormat || tenant?.dateFormat || 'DD/MM/YYYY',
          numberFormat: settings.numberFormat || '1,000.00'
        }));
      } catch (error) {
        console.error('Failed to load user details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserDetails();
  }, [user, tenant]);

  const handleSave = async () => {
    try {
      setSaving(true);
      // Update profile
      await settingsAPI.updateProfileSettings({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone
      });
      
      // Update preferences
      await settingsAPI.updatePreferences({
        dateFormat: formData.dateFormat,
        timezone: formData.timezone,
        numberFormat: formData.numberFormat
      });
      
      alert('Profile updated successfully!');
      window.location.reload(); // Reload to get updated user data
    } catch (error: any) {
      console.error('Failed to save:', error);
      alert(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Header
        onMenuClick={() => {}}
        title="User Details"
        subtitle="Manage your profile and preferences"
        showSearch={false}
      />
      
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Profile Info */}
        <ModernCard title="Profile Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email (Login) *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (876) 123-4567"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'OWNER' | 'ACCOUNTANT' | 'STAFF' | 'READONLY' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled
              >
                <option value="OWNER">Owner</option>
                <option value="ACCOUNTANT">Accountant</option>
                <option value="STAFF">Staff</option>
                <option value="READONLY">Read Only</option>
              </select>
              <p className="text-xs text-gray-500">Role can only be changed by account owner</p>
            </div>
          </div>
        </ModernCard>

        {/* Preferences */}
        <ModernCard title="Preferences">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <option value="1,000.00">1,000.00 (US)</option>
                <option value="1.000,00">1.000,00 (EU)</option>
                <option value="1 000.00">1 000.00 (Space)</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="defaultDashboard">Default Dashboard</Label>
              <select
                id="defaultDashboard"
                value={formData.defaultDashboard}
                onChange={(e) => setFormData({ ...formData, defaultDashboard: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="overview">Overview</option>
                <option value="invoices">Invoices</option>
                <option value="reports">Reports</option>
              </select>
            </div>
          </div>
        </ModernCard>

        {/* Security */}
        <ModernCard title="Security">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-green-600" />
                <div>
                  <h4 className="font-medium">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-600">Add an extra layer of security</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.twoFactorEnabled}
                  onChange={(e) => setFormData({ ...formData, twoFactorEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <h4 className="font-medium">Connected Devices / Sessions</h4>
                  <p className="text-sm text-gray-600">View and manage active sessions</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Manage Sessions
              </Button>
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

