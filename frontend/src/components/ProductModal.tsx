'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { productAPI } from '@/lib/api';
import {
  X,
  Package,
  DollarSign,
  Percent,
  Tag,
  Save,
  Loader2,
  Hash,
  FileText,
  Building,
  Globe,
} from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  description: string;
  sku?: string;
  unitPrice: number;
  unit: string;
  taxRate: number;
  category: string;
  isActive: boolean;
  stockQuantity?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  isService: boolean;
  priority?: 'NORMAL' | 'CRITICAL' | 'MUST_HAVE';
  createdAt: string;
  updatedAt: string;
}

interface ProductModalProps {
  product?: Product | null;
  onClose: () => void;
  onSave: (productData: Partial<Product>) => void;
}

export default function ProductModal({ product, onClose, onSave }: ProductModalProps) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    sku: product?.sku || '',
    unitPrice: product?.unitPrice || '',
    unit: product?.unit || 'PIECE',
    taxRate: product?.taxRate || '',
    category: product?.category || 'SERVICES',
    isActive: product?.isActive ?? true,
    stockQuantity: product?.stockQuantity || '',
    minStockLevel: product?.minStockLevel || '',
    maxStockLevel: product?.maxStockLevel || '',
    isService: product?.isService ?? false,
    priority: product?.priority || 'NORMAL',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Product name is required');
      return false;
    }
    const unitPrice = typeof formData.unitPrice === 'number' ? formData.unitPrice : (formData.unitPrice ? parseFloat(String(formData.unitPrice)) : 0);
    const taxRate = typeof formData.taxRate === 'number' ? formData.taxRate : (formData.taxRate ? parseFloat(String(formData.taxRate)) : 0);
    const stockQuantity = typeof formData.stockQuantity === 'number' ? formData.stockQuantity : (formData.stockQuantity ? parseInt(String(formData.stockQuantity)) : 0);
    const minStockLevel = typeof formData.minStockLevel === 'number' ? formData.minStockLevel : (formData.minStockLevel ? parseInt(String(formData.minStockLevel)) : 0);
    const maxStockLevel = typeof formData.maxStockLevel === 'number' ? formData.maxStockLevel : (formData.maxStockLevel ? parseInt(String(formData.maxStockLevel)) : 0);
    
    if (!unitPrice || unitPrice <= 0) {
      setError('Unit price must be greater than 0');
      return false;
    }
    if (taxRate < 0 || taxRate > 100) {
      setError('Tax rate must be between 0 and 100');
      return false;
    }
    if (!formData.isService && stockQuantity < 0) {
      setError('Stock quantity cannot be negative');
      return false;
    }
    if (!formData.isService && minStockLevel < 0) {
      setError('Minimum stock level cannot be negative');
      return false;
    }
    if (!formData.isService && maxStockLevel < minStockLevel) {
      setError('Maximum stock level must be greater than minimum stock level');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      console.log('💾 Saving product data:', formData);
      console.log('🔍 Form data details:', {
        name: formData.name,
        description: formData.description,
        sku: formData.sku,
        unitPrice: formData.unitPrice,
        unit: formData.unit,
        taxRate: formData.taxRate,
        category: formData.category,
        isActive: formData.isActive,
        stockQuantity: formData.stockQuantity,
        minStockLevel: formData.minStockLevel,
        maxStockLevel: formData.maxStockLevel,
        isService: formData.isService
      });
      
      // Convert empty strings to numbers for API
      const dataToSend: any = {
        ...formData,
        unitPrice: typeof formData.unitPrice === 'number' ? formData.unitPrice : (formData.unitPrice ? parseFloat(String(formData.unitPrice)) : 0),
        taxRate: typeof formData.taxRate === 'number' ? formData.taxRate : (formData.taxRate ? parseFloat(String(formData.taxRate)) : 15),
        stockQuantity: typeof formData.stockQuantity === 'number' ? formData.stockQuantity : (formData.stockQuantity ? parseInt(String(formData.stockQuantity)) : 0),
        minStockLevel: typeof formData.minStockLevel === 'number' ? formData.minStockLevel : (formData.minStockLevel ? parseInt(String(formData.minStockLevel)) : 0),
        maxStockLevel: typeof formData.maxStockLevel === 'number' ? formData.maxStockLevel : (formData.maxStockLevel ? parseInt(String(formData.maxStockLevel)) : 100),
      };
      
      if (!dataToSend.sku || dataToSend.sku.trim() === '') {
        delete dataToSend.sku;
      }
      console.log('📤 Data being sent to API:', JSON.stringify(dataToSend, null, 2));
      
      let response;
      if (product) {
        // Update existing product
        const updateData = { ...dataToSend };
        // Only include SKU if it has a value, otherwise let backend handle it
        if (!updateData.sku || updateData.sku.trim() === '') {
          updateData.sku = ''; // Send empty string, backend will handle
        }
        response = await productAPI.updateProduct(product._id, updateData);
      } else {
        // Create new product
        const createData = { ...dataToSend };
        // Only include SKU if it has a value, otherwise let backend handle it
        if (!createData.sku || createData.sku.trim() === '') {
          createData.sku = ''; // Send empty string, backend will handle
        }
        response = await productAPI.createProduct(createData);
      }
      
      console.log('✅ Product saved successfully:', response.data);
      
      // Pass the created/updated product data to parent
      // Backend returns { success: true, message: "...", data: product }
      const productData = response.data.data || response.data;
      onSave(productData);
      
      setSuccess(product ? 'Product updated successfully!' : 'Product added successfully!');
      
      // Close modal after a brief delay to show success message
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (err: any) {
      console.error('❌ Error saving product:', err);
      
      // Enhanced error logging as suggested
      if (err.response) {
        console.error('❌ API Error Details:', {
          status: err.response?.status,
          statusText: err.response?.statusText,
          url: err.config?.url,
          data: err.response?.data,
          requestData: err.config?.data,
        });
      } else {
        console.error('❌ Network/Other Error:', err.message);
      }
      
      const errorMessage = err.response?.data?.message || 'Failed to save product. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'SERVICES', label: 'Services' },
    { value: 'GOODS', label: 'Goods' },
    { value: 'DIGITAL', label: 'Digital Products' },
    { value: 'CONSULTING', label: 'Consulting' },
    { value: 'SOFTWARE', label: 'Software' },
    { value: 'HARDWARE', label: 'Hardware' },
    { value: 'OTHER', label: 'Other' },
  ];

  const units = [
    { value: 'NONE', label: 'None' },
    { value: 'PIECE', label: 'Piece' },
    { value: 'HOUR', label: 'Hour' },
    { value: 'DAY', label: 'Day' },
    { value: 'MONTH', label: 'Month' },
    { value: 'YEAR', label: 'Year' },
    { value: 'KG', label: 'Kilogram' },
    { value: 'LITER', label: 'Liter' },
    { value: 'METER', label: 'Meter' },
    { value: 'SQUARE_METER', label: 'Square Meter' },
    { value: 'CUBIC_METER', label: 'Cubic Meter' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-3xl z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {product ? 'Edit Product' : 'Add New Product'}
                </h2>
                <p className="text-gray-600 font-medium">
                  {product ? 'Update product information' : 'Create a new product or service'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl p-2"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Status Messages */}
          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800 font-medium">{success}</AlertDescription>
            </Alert>
          )}

          {/* Basic Information */}
          <Card className="border-gray-200 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Package className="h-5 w-5 text-blue-600" />
                <span>Basic Information</span>
              </CardTitle>
              <CardDescription>Essential product details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                    Product/Service Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter product or service name"
                    className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500/30 transition-all duration-300 font-medium"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sku" className="text-sm font-semibold text-gray-700">
                    SKU (Optional)
                  </Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => handleInputChange('sku', e.target.value.toUpperCase())}
                      placeholder="PROD-001"
                      className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500/30 transition-all duration-300 font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
                  Description
                </Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter product description"
                    rows={3}
                    className="pl-10 w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500/30 transition-all duration-300 font-medium resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-semibold text-gray-700">
                    Category *
                  </Label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="pl-10 w-full h-11 px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500/30 transition-all duration-300 font-medium bg-white"
                      required
                    >
                      {categories.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="unit" className="text-sm font-semibold text-gray-700">
                    Unit *
                  </Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <select
                      id="unit"
                      value={formData.unit}
                      onChange={(e) => handleInputChange('unit', e.target.value)}
                      className="pl-10 w-full h-11 px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500/30 transition-all duration-300 font-medium bg-white"
                      required
                    >
                      {units.map((unit) => (
                        <option key={unit.value} value={unit.value}>
                          {unit.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Information */}
          <Card className="border-gray-200 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <span>Pricing Information</span>
              </CardTitle>
              <CardDescription>Product pricing and tax details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="unitPrice" className="text-sm font-semibold text-gray-700">
                    Unit Price (J$) *
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="unitPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.unitPrice}
                      onChange={(e) => handleInputChange('unitPrice', e.target.value === '' ? '' : parseFloat(e.target.value) || '')}
                      placeholder=""
                      className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500/30 transition-all duration-300 font-medium"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="taxRate" className="text-sm font-semibold text-gray-700">
                    Tax Rate (%) *
                  </Label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="taxRate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.taxRate}
                      onChange={(e) => handleInputChange('taxRate', e.target.value === '' ? '' : parseFloat(e.target.value) || '')}
                      placeholder=""
                      className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500/30 transition-all duration-300 font-medium"
                      required
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Information */}
          <Card className="border-gray-200 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Package className="h-5 w-5 text-blue-600" />
                <span>Inventory Information</span>
              </CardTitle>
              <CardDescription>Stock levels and service settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isService"
                    checked={formData.isService}
                    onChange={(e) => handleInputChange('isService', e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <Label htmlFor="isService" className="text-sm font-semibold text-gray-700">
                    This is a Service (No Physical Inventory)
                  </Label>
                </div>
                <p className="text-xs text-gray-500 ml-7">
                  Services don't require stock tracking
                </p>
              </div>

              {!formData.isService && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="stockQuantity" className="text-sm font-semibold text-gray-700">
                      Current Stock
                    </Label>
                    <Input
                      id="stockQuantity"
                      type="number"
                      min="0"
                      value={formData.stockQuantity}
                      onChange={(e) => handleInputChange('stockQuantity', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                      placeholder=""
                      className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500/30 transition-all duration-300 font-medium"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="minStockLevel" className="text-sm font-semibold text-gray-700">
                      Minimum Stock Level
                    </Label>
                    <Input
                      id="minStockLevel"
                      type="number"
                      min="0"
                      value={formData.minStockLevel}
                      onChange={(e) => handleInputChange('minStockLevel', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                      placeholder=""
                      className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500/30 transition-all duration-300 font-medium"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxStockLevel" className="text-sm font-semibold text-gray-700">
                      Maximum Stock Level
                    </Label>
                    <Input
                      id="maxStockLevel"
                      type="number"
                      min="0"
                      value={formData.maxStockLevel}
                      onChange={(e) => handleInputChange('maxStockLevel', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                      placeholder=""
                      className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500/30 transition-all duration-300 font-medium"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status & Priority */}
          <Card className="border-gray-200 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Globe className="h-5 w-5 text-blue-600" />
                <span>Status & Priority</span>
              </CardTitle>
              <CardDescription>Product availability and priority settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="isActive" className="text-sm font-semibold text-gray-700">
                  Product Status
                </Label>
                <select
                  id="isActive"
                  value={formData.isActive ? 'active' : 'inactive'}
                  onChange={(e) => handleInputChange('isActive', e.target.value === 'active')}
                  className="w-full h-11 px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500/30 transition-all duration-300 font-medium bg-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority" className="text-sm font-semibold text-gray-700">
                  Priority Level
                </Label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  className="w-full h-11 px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500/30 transition-all duration-300 font-medium bg-white"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="MUST_HAVE">Must Have</option>
                </select>
                <p className="text-xs text-gray-500">
                  Critical and Must Have products will be highlighted when stock is low
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-8 py-3 font-semibold border-gray-200 hover:bg-gray-50 transition-all duration-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="px-8 py-3 font-semibold bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>{product ? 'Update Product' : 'Add Product'}</span>
                </div>
              )}
            </Button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
