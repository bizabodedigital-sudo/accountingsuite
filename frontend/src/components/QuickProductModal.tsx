'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ModernCard } from '@/components/ui/modern-card';
import { X, Save, Package } from 'lucide-react';

interface QuickProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: (product: any) => void;
}

export default function QuickProductModal({ isOpen, onClose, onProductCreated }: QuickProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unitPrice: 0,
    taxRate: 15,
    unit: 'PIECE'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Product name is required');
      return;
    }
    
    if (formData.unitPrice <= 0) {
      setError('Unit price must be greater than 0');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('➕ Creating new product:', formData);
      
      const newProduct = {
        _id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        unitPrice: formData.unitPrice,
        taxRate: formData.taxRate,
        unit: formData.unit,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      onProductCreated(newProduct);
      
      // Show success message briefly
      setError('');
      setSuccess(true);
      setTimeout(() => {
        // Reset form
        setFormData({
          name: '',
          description: '',
          unitPrice: 0,
          taxRate: 15,
          unit: 'PIECE'
        });
        setSuccess(false);
        onClose();
      }, 1000);
      
    } catch (err: any) {
      console.error('❌ Error creating product:', err);
      setError('Failed to create product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Add Product</h2>
                <p className="text-gray-600 text-sm">Create a new product quickly</p>
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
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm font-medium">Product created successfully! Adding to invoice...</p>
            </div>
          )}

          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
              Product Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter product name"
              className="h-11 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/30 transition-all duration-300 font-medium"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
              Description
            </Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Product description"
              className="h-11 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/30 transition-all duration-300 font-medium"
            />
          </div>

          {/* Unit Price */}
          <div className="space-y-2">
            <Label htmlFor="unitPrice" className="text-sm font-semibold text-gray-700">
              Unit Price (J$) *
            </Label>
            <Input
              id="unitPrice"
              type="number"
              min="0"
              step="0.01"
              value={formData.unitPrice}
              onChange={(e) => setFormData(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
              className="h-11 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/30 transition-all duration-300 font-medium"
              required
            />
          </div>

          {/* Tax Rate */}
          <div className="space-y-2">
            <Label htmlFor="taxRate" className="text-sm font-semibold text-gray-700">
              Tax Rate (%)
            </Label>
            <Input
              id="taxRate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={formData.taxRate}
              onChange={(e) => setFormData(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
              placeholder="15"
              className="h-11 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/30 transition-all duration-300 font-medium"
            />
          </div>

          {/* Unit */}
          <div className="space-y-2">
            <Label htmlFor="unit" className="text-sm font-semibold text-gray-700">
              Unit
            </Label>
            <select
              id="unit"
              value={formData.unit}
              onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
              className="w-full h-11 px-3 py-2 border border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-emerald-500/30 transition-all duration-300 font-medium bg-white"
            >
              <option value="PIECE">Piece</option>
              <option value="HOUR">Hour</option>
              <option value="DAY">Day</option>
              <option value="MONTH">Month</option>
              <option value="KG">Kilogram</option>
              <option value="LITER">Liter</option>
            </select>
          </div>

          {/* Action Buttons */}
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
              className="px-6 py-2 font-semibold bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>Create Product</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}