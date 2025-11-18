'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Package, DollarSign, Clock } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  description: string;
  unitPrice: number;
  unit: string;
  taxRate: number;
  sku: string;
}

interface ProductSearchProps {
  products: Product[];
  onProductSelect: (product: Product) => void;
  placeholder?: string;
  className?: string;
}

export default function ProductSearch({
  products,
  onProductSelect,
  placeholder = "Search products...",
  className = ""
}: ProductSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 8); // Limit to 8 results for better UX

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsOpen(value.length > 0);
    setSelectedIndex(-1);
  };

  // Handle product selection
  const handleProductSelect = (product: Product) => {
    setSearchTerm(product.name);
    setIsOpen(false);
    onProductSelect(product);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredProducts.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredProducts.length) {
          handleProductSelect(filteredProducts[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-JM', {
      style: 'currency',
      currency: 'JMD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Format unit
  const formatUnit = (unit: string) => {
    const unitMap: { [key: string]: string } = {
      'HOUR': 'hr',
      'DAY': 'day',
      'MONTH': 'mo',
      'YEAR': 'yr',
      'PIECE': 'pc',
      'KG': 'kg',
      'LITER': 'L',
      'METER': 'm',
      'SQUARE_METER': 'm²',
      'CUBIC_METER': 'm³',
      'PROJECT': 'project'
    };
    return unitMap[unit] || unit.toLowerCase();
  };

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(searchTerm.length > 0)}
          placeholder={placeholder}
          className={`w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500/30 transition-all duration-300 bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl font-semibold ${className}`}
        />
      </div>

      {/* Dropdown Results */}
      {isOpen && filteredProducts.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-y-auto"
        >
          {filteredProducts.map((product, index) => (
            <div
              key={product._id}
              onClick={() => handleProductSelect(product)}
              className={`px-4 py-3 cursor-pointer transition-colors duration-200 border-b border-gray-100 last:border-b-0 ${
                index === selectedIndex
                  ? 'bg-blue-50 border-blue-200'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <Package className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                      {product.name}
                    </h4>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <DollarSign className="w-3 h-3" />
                      <span className="font-medium">
                        {formatCurrency(product.unitPrice)}/{formatUnit(product.unit)}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      SKU: {product.sku}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      Tax: {product.taxRate}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {isOpen && searchTerm.length > 0 && filteredProducts.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-4">
          <div className="text-center text-gray-500">
            <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No products found for "{searchTerm}"</p>
            <p className="text-xs mt-1">Try a different search term</p>
          </div>
        </div>
      )}
    </div>
  );
}









