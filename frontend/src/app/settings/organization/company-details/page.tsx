'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Save, Upload, Globe, MapPin, Phone, Mail, FileText } from 'lucide-react';
import { settingsAPI } from '@/lib/api';

export default function CompanyDetailsPage() {
  const { tenant } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    // Details
    name: '',
    legalName: '',
    idNumber: '',
    trn: '',
    gctNumber: '',
    industry: '',
    fiscalYearStart: '',
    currency: 'JMD',
    // Address
    street1: '',
    street2: '',
    city: '',
    parish: '',
    country: 'Jamaica',
    phone: '',
    email: '',
    website: '',
    // Defaults
    defaultInvoiceTerms: '',
    defaultPaymentTerms: 'Net 30',
    defaultLanguage: 'en',
    defaultTaxRate: 15,
    defaultDocumentFooter: ''
  });

  useEffect(() => {
    const loadCompanyDetails = async () => {
      try {
        setLoading(true);
        const response = await settingsAPI.getAllSettings();
        const settings = response.data?.data?.settings || {};
        const companyDetails = settings.companyDetails || {};
        const tenantData = response.data?.data?.tenant || {};
        
        // Parse address if it's a string
        let street1 = '', city = '', parish = '', country = 'Jamaica';
        if (tenantData.address) {
          const addressParts = tenantData.address.split(',');
          if (addressParts.length >= 3) {
            street1 = addressParts[0].trim();
            city = addressParts[1].trim();
            parish = addressParts[2].trim();
            country = addressParts[3]?.trim() || 'Jamaica';
          }
        }
        
        setFormData(prev => ({
          ...prev,
          name: tenantData.name || tenant?.name || '',
          email: tenantData.email || tenant?.email || '',
          phone: tenantData.phone || tenant?.phone || '',
          currency: tenantData.currency || tenant?.currency || 'JMD',
          street1: companyDetails.street1 || street1,
          city: companyDetails.city || city,
          parish: companyDetails.parish || parish,
          country: companyDetails.country || country,
          legalName: companyDetails.legalName || '',
          idNumber: companyDetails.idNumber || '',
          trn: tenantData.taxId || tenant?.taxId || '',
          gctNumber: companyDetails.gctNumber || '',
          industry: companyDetails.industry || '',
          fiscalYearStart: companyDetails.fiscalYearStart || '',
          website: companyDetails.website || '',
          defaultInvoiceTerms: companyDetails.defaultInvoiceTerms || '',
          defaultPaymentTerms: companyDetails.defaultPaymentTerms || 'Net 30',
          defaultLanguage: settings.defaultLanguage || 'en',
          defaultTaxRate: companyDetails.defaultTaxRate || 15,
          defaultDocumentFooter: companyDetails.defaultDocumentFooter || ''
        }));
      } catch (error) {
        console.error('Failed to load company details:', error);
        // Fallback to tenant data
        if (tenant) {
          setFormData(prev => ({
            ...prev,
            name: tenant.name || '',
            email: tenant.email || '',
            phone: tenant.phone || '',
            currency: tenant.currency || 'JMD'
          }));
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadCompanyDetails();
  }, [tenant]);

  const handleSave = async () => {
    try {
      setSaving(true);
      // Update tenant basic info
      await settingsAPI.updateTenantSettings({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: `${formData.street1}, ${formData.city}, ${formData.parish}, ${formData.country}`,
        currency: formData.currency,
        taxId: formData.trn
      });
      
      // Update company details
      await settingsAPI.updateCompanyDetails({
        legalName: formData.legalName,
        idNumber: formData.idNumber,
        gctNumber: formData.gctNumber,
        industry: formData.industry,
        fiscalYearStart: formData.fiscalYearStart,
        street1: formData.street1,
        street2: formData.street2,
        city: formData.city,
        parish: formData.parish,
        country: formData.country,
        website: formData.website,
        defaultInvoiceTerms: formData.defaultInvoiceTerms,
        defaultPaymentTerms: formData.defaultPaymentTerms,
        defaultTaxRate: formData.defaultTaxRate,
        defaultDocumentFooter: formData.defaultDocumentFooter
      });
      
      alert('Company details saved successfully!');
    } catch (error: any) {
      console.error('Failed to save:', error);
      alert(error.response?.data?.error || 'Failed to save company details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Header
        onMenuClick={() => {}}
        title="Company Details"
        subtitle="Manage your company information and defaults"
        showSearch={false}
      />
      
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Details Tab */}
        <ModernCard title="Company Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your Company Name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="legalName">Legal Name</Label>
              <Input
                id="legalName"
                value={formData.legalName}
                onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                placeholder="Legal business name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="idNumber">ID Number / Registration Number</Label>
              <Input
                id="idNumber"
                value={formData.idNumber}
                onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                placeholder="Registration number"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="trn">TRN (Tax Registration Number)</Label>
              <Input
                id="trn"
                value={formData.trn}
                onChange={(e) => setFormData({ ...formData, trn: e.target.value })}
                placeholder="123-456-789"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gctNumber">GCT Registration Number</Label>
              <Input
                id="gctNumber"
                value={formData.gctNumber}
                onChange={(e) => setFormData({ ...formData, gctNumber: e.target.value })}
                placeholder="GCT number"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="e.g., Retail, Services, Manufacturing"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fiscalYearStart">Fiscal Year Start</Label>
              <Input
                id="fiscalYearStart"
                type="month"
                value={formData.fiscalYearStart}
                onChange={(e) => setFormData({ ...formData, fiscalYearStart: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currency">Default Currency</Label>
              <select
                id="currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="JMD">Jamaican Dollar (J$)</option>
                <option value="USD">US Dollar ($)</option>
                <option value="EUR">Euro (€)</option>
                <option value="GBP">British Pound (£)</option>
              </select>
            </div>
          </div>
        </ModernCard>

        {/* Address */}
        <ModernCard title="Address">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="street1">Street Address 1</Label>
              <Input
                id="street1"
                value={formData.street1}
                onChange={(e) => setFormData({ ...formData, street1: e.target.value })}
                placeholder="123 Main Street"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="street2">Street Address 2</Label>
              <Input
                id="street2"
                value={formData.street2}
                onChange={(e) => setFormData({ ...formData, street2: e.target.value })}
                placeholder="Suite, Unit, etc."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="city">City / Town</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Kingston"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="parish">Parish / State / Region</Label>
              <Input
                id="parish"
                value={formData.parish}
                onChange={(e) => setFormData({ ...formData, parish: e.target.value })}
                placeholder="St. Andrew"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="company@example.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://www.example.com"
              />
            </div>
          </div>
        </ModernCard>

        {/* Logo */}
        <ModernCard title="Logo">
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="h-24 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <Building2 className="w-12 h-12 text-gray-400" />
              </div>
              <div>
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Logo
                </Button>
                <p className="text-xs text-gray-500 mt-2">Recommended: 200x200px, PNG or JPG</p>
              </div>
            </div>
          </div>
        </ModernCard>

        {/* Defaults */}
        <ModernCard title="Defaults">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="defaultInvoiceTerms">Default Invoice Terms</Label>
              <Input
                id="defaultInvoiceTerms"
                value={formData.defaultInvoiceTerms}
                onChange={(e) => setFormData({ ...formData, defaultInvoiceTerms: e.target.value })}
                placeholder="Payment due in 7 days"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="defaultPaymentTerms">Default Payment Terms</Label>
              <select
                id="defaultPaymentTerms"
                value={formData.defaultPaymentTerms}
                onChange={(e) => setFormData({ ...formData, defaultPaymentTerms: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="Due on Receipt">Due on Receipt</option>
                <option value="Net 7">Net 7</option>
                <option value="Net 14">Net 14</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 60">Net 60</option>
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
            
            <div className="space-y-2">
              <Label htmlFor="defaultTaxRate">Default Tax Rate (%)</Label>
              <Input
                id="defaultTaxRate"
                type="number"
                value={formData.defaultTaxRate}
                onChange={(e) => setFormData({ ...formData, defaultTaxRate: parseFloat(e.target.value) })}
                placeholder="15"
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="defaultDocumentFooter">Default Document Footer</Label>
              <textarea
                id="defaultDocumentFooter"
                value={formData.defaultDocumentFooter}
                onChange={(e) => setFormData({ ...formData, defaultDocumentFooter: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                placeholder="Company disclaimers, terms, etc."
              />
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

