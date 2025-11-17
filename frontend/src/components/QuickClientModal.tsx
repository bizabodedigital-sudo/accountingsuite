'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ModernCard } from '@/components/ui/modern-card';
import { X, Save, User } from 'lucide-react';
import { customerAPI } from '@/lib/api';

interface QuickClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated: (client: any) => void;
}

export default function QuickClientModal({ isOpen, onClose, onClientCreated }: QuickClientModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    taxId: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Client name is required');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await customerAPI.createCustomer(formData);
      
      if (response.data.success) {
        onClientCreated(response.data.data);
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          address: '',
          taxId: ''
        });
        onClose();
      } else {
        setError(response.data.error || 'Failed to create client');
      }
    } catch (err: any) {
      console.error('Create client error:', err);
      setError(err.response?.data?.error || 'Failed to create client');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(''); // Clear error when user starts typing
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Add New Client</h2>
                <p className="text-gray-600 text-sm">Create a new client quickly</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl p-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
              Client Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter client name"
              className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500/30 transition-all duration-300 font-medium"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="client@company.com"
              className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500/30 transition-all duration-300 font-medium"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
              Phone
            </Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+1-876-555-0123"
              className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500/30 transition-all duration-300 font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-semibold text-gray-700">
              Address
            </Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="123 Main Street, Kingston"
              className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500/30 transition-all duration-300 font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxId" className="text-sm font-semibold text-gray-700">
              Tax ID
            </Label>
            <Input
              id="taxId"
              value={formData.taxId}
              onChange={(e) => handleInputChange('taxId', e.target.value)}
              placeholder="TRN: 123456789"
              className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500/30 transition-all duration-300 font-medium"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-6 py-2 font-semibold border-gray-200 hover:bg-gray-50 transition-all duration-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="px-6 py-2 font-semibold bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>Create Client</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

