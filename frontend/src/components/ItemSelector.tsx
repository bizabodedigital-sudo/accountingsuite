'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, X, Package } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  description: string;
  unitPrice: number;
  taxRate: number;
  unit: string;
}

interface ItemSelectorProps {
  value: string;
  onChange: (value: string) => void;
  products: Product[];
  onProductSelected: (product: Product) => void;
  onProductCreated: (product: Product) => void;
  placeholder?: string;
}

export default function ItemSelector({
  value,
  onChange,
  products,
  onProductSelected,
  onProductCreated,
  placeholder = "Type item name..."
}: ItemSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    unitPrice: '',
    taxRate: '15',
    unit: 'HOUR'
  });
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowAddForm(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update search term when value changes externally
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
    
    if (newValue.length > 0) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleProductSelect = (product: Product) => {
    onChange(product.name);
    onProductSelected(product);
    setIsOpen(false);
  };

  const handleAddNew = () => {
    setShowAddForm(true);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newProduct.name.trim()) {
      setError('Product name is required');
      return;
    }

    if (!newProduct.unitPrice || parseFloat(newProduct.unitPrice) < 0) {
      setError('Unit price must be a valid positive number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const productData = {
        ...newProduct,
        unitPrice: parseFloat(newProduct.unitPrice),
        taxRate: parseFloat(newProduct.taxRate)
      };

      // For now, we'll simulate the API call since we don't have a products API yet
      const mockProduct = {
        _id: Date.now().toString(),
        ...productData,
        createdAt: new Date().toISOString()
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      onProductCreated(mockProduct);
      
      setNewProduct({
        name: '',
        description: '',
        unitPrice: '',
        taxRate: '15',
        unit: 'HOUR'
      });
      setShowAddForm(false);
      setIsOpen(false);
    } catch (err: any) {
      console.error('Create product error:', err);
      setError('Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Input
        ref={inputRef}
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={() => {
          if (searchTerm.length > 0) {
            setIsOpen(true);
          }
        }}
        placeholder={placeholder}
        className="pr-10"
      />

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {!showAddForm ? (
            <>
              {/* Search Results */}
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <div
                    key={product._id}
                    onClick={() => handleProductSelect(product)}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                  >
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-500">{product.description}</div>
                    <div className="text-sm text-blue-600 font-medium">
                      ${product.unitPrice.toFixed(2)}/{product.unit}
                    </div>
                  </div>
                ))
              ) : searchTerm ? (
                <div className="px-4 py-3 text-gray-500 text-sm">
                  No products found for "{searchTerm}"
                </div>
              ) : null}

              {/* Add New Product Option */}
              {searchTerm && (
                <div
                  onClick={handleAddNew}
                  className="px-4 py-2 hover:bg-green-50 cursor-pointer border-t border-gray-200 bg-gray-50"
                >
                  <div className="flex items-center space-x-2 text-green-600">
                    <Plus className="h-4 w-4" />
                    <span className="font-medium">Add "{searchTerm}" as new product</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Add Product Form */
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-gray-900">Add New Product</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleCreateProduct} className="space-y-3">
                {error && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <Input
                    placeholder="Product name *"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Input
                    placeholder="Description"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Unit Price *"
                    value={newProduct.unitPrice}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, unitPrice: e.target.value }))}
                    required
                  />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="Tax Rate %"
                    value={newProduct.taxRate}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, taxRate: e.target.value }))}
                  />
                </div>

                <div>
                  <select
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="HOUR">Hour</option>
                    <option value="DAY">Day</option>
                    <option value="PIECE">Piece</option>
                    <option value="PROJECT">Project</option>
                    <option value="MONTH">Month</option>
                    <option value="YEAR">Year</option>
                  </select>
                </div>

                <div className="flex space-x-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}










