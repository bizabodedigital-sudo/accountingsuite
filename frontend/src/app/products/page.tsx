'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModernCard, StatCard } from '@/components/ui/modern-card';
import Header from '@/components/Header';
import { 
  Package, 
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Package2,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { productAPI } from '@/lib/api';
import ProductModal from '@/components/ProductModal';

interface Product {
  _id: string;
  name: string;
  description: string;
  sku: string;
  category: string;
  unitPrice: number;
  cost: number;
  stockQuantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  isActive: boolean;
  isService: boolean;
  taxRate: number;
  tags: string[];
  stockStatus: string;
  totalValue: number;
  profitMargin: number;
  createdAt: string;
  unit: string;
  updatedAt: string;
  priority: 'NORMAL' | 'CRITICAL' | 'MUST_HAVE';
}

export default function ProductsPage() {
  const { user, tenant, isLoading, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProductsCount, setTotalProductsCount] = useState(0);

  // Load products from API
  useEffect(() => {
    console.log('🔍 ProductsPage useEffect triggered:', {
      isLoading,
      isAuthenticated,
      user: !!user,
      tenant: !!tenant
    });
    
    if (!isLoading && isAuthenticated) {
      console.log('✅ Auth ready, loading products...');
      loadProducts();
    } else if (!isLoading && !isAuthenticated) {
      console.log('❌ Not authenticated, redirecting to login...');
      window.location.href = '/login';
    }
  }, [isLoading, isAuthenticated, user, tenant]);

  // Reload products when page changes
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      loadProducts();
    }
  }, [currentPage]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Loading products from API...');
      
      const response = await productAPI.getProducts({ 
        page: currentPage, 
        limit: 10
      }); // Fetch products with pagination
      console.log('✅ Products API response:', response);
      
      const productsData = response.data?.data || response.data || [];
      const pagination = response.data?.pagination;
      
      setProducts(productsData);
      setTotalPages(pagination?.pages || 1);
      setTotalProductsCount(pagination?.total || productsData.length);
      console.log('✅ Products loaded:', productsData.length, 'Page:', currentPage, 'of', pagination?.pages);
      
    } catch (err: any) {
      console.error('❌ Failed to load products:', err);
      console.error('❌ Error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      });
      
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
        window.location.href = '/login';
      } else {
        setError('Failed to load products. Please try again.');
      }
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (productData: Partial<Product>) => {
    // Add the new product directly to the list for instant feedback
    console.log('🔄 Adding new product to list:', productData);
    setProducts(prev => [...prev, productData as Product]);
    setShowAddModal(false);
    
    // Also refresh from API to ensure data consistency
    setTimeout(async () => {
      await loadProducts();
    }, 100);
  };

  const handleEditProduct = async (productData: Partial<Product>) => {
    // Update the product in the list for instant feedback
    console.log('🔄 Updating product in list:', productData);
    setProducts(prev => prev.map(p => p._id === editingProduct?._id ? { ...p, ...productData } : p));
    setEditingProduct(null);
    
    // Also refresh from API to ensure data consistency
    setTimeout(async () => {
      await loadProducts();
    }, 100);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      console.log('🗑️ Deleting product:', productId);
      
      await productAPI.deleteProduct(productId);
      console.log('✅ Product deleted');
      
      // Reload products to remove the deleted one
      await loadProducts();
    } catch (err: any) {
      console.error('❌ Error deleting product:', err);
      alert('Failed to delete product. Please try again.');
    }
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/login';
    }
  }, [isLoading, isAuthenticated]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  const categories = ['SERVICES', 'SOFTWARE', 'HARDWARE', 'CONSULTING', 'DIGITAL', 'GOODS', 'OTHER'];
  
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, p) => sum + (p.stockQuantity * p.unitPrice), 0);
  const lowStockCount = products.filter(p => p.stockQuantity <= p.minStockLevel && p.stockQuantity > 0).length;
  const outOfStockCount = products.filter(p => p.stockQuantity === 0 && !p.isService).length;

  const getStockStatus = (product: Product) => {
    if (product.isService) return 'SERVICE';
    if (product.stockQuantity === 0) return 'OUT_OF_STOCK';
    if (product.stockQuantity <= product.minStockLevel) return 'LOW_STOCK';
    if (product.stockQuantity >= product.maxStockLevel) return 'OVERSTOCK';
    return 'IN_STOCK';
  };

  const getStockStatusIcon = (product: Product) => {
    const status = getStockStatus(product);
    switch (status) {
      case 'LOW_STOCK':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'OUT_OF_STOCK':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'OVERSTOCK':
        return <TrendingUp className="w-4 h-4 text-blue-500" />;
      case 'SERVICE':
        return <Package className="w-4 h-4 text-purple-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getStockStatusColor = (product: Product) => {
    const status = getStockStatus(product);
    switch (status) {
      case 'LOW_STOCK':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'OUT_OF_STOCK':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'OVERSTOCK':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'SERVICE':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      default:
        return 'bg-green-50 border-green-200 text-green-800';
    }
  };

  const getRowHighlightClass = (product: Product) => {
    const isLowStock = product.stockQuantity <= product.minStockLevel && product.stockQuantity > 0;
    const isOutOfStock = product.stockQuantity === 0 && !product.isService;
    const isCritical = product.priority === 'CRITICAL' || product.priority === 'MUST_HAVE';
    
    if (isCritical && (isLowStock || isOutOfStock)) {
      return 'bg-red-50 border-l-4 border-red-500';
    } else if (isLowStock) {
      return 'bg-yellow-50 border-l-4 border-yellow-500';
    } else if (isOutOfStock) {
      return 'bg-orange-50 border-l-4 border-orange-500';
    }
    return '';
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'MUST_HAVE':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredProducts = products.filter((product) => {
    // Safely handle undefined/null values
    const name = product.name || '';
    const description = product.description || '';
    const sku = product.sku || '';
    
    const matchesSearch = 
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    
    // Stock filtering
    let matchesStock = true;
    if (stockFilter === 'low') {
      matchesStock = product.stockQuantity <= product.minStockLevel && product.stockQuantity > 0;
    } else if (stockFilter === 'out') {
      matchesStock = product.stockQuantity === 0 && !product.isService;
    } else if (stockFilter === 'critical') {
      matchesStock = (product.priority === 'CRITICAL' || product.priority === 'MUST_HAVE') && 
                     product.stockQuantity <= product.minStockLevel;
    }
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <Header 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        title="Products & Inventory"
        subtitle="Manage your products, services, and inventory"
      />
      
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
            <button 
              onClick={loadProducts}
              className="ml-2 text-red-800 underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Products"
            value={totalProducts.toString()}
            change={`${products.filter(p => p.isService).length} services, ${products.filter(p => !p.isService).length} goods`}
            changeType="neutral"
            icon={<Package className="w-6 h-6 text-blue-600" />}
            className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200"
          />
          
          <StatCard
            title="Inventory Value"
            value={`J$${totalValue.toLocaleString()}`}
            change="Total stock value"
            changeType="positive"
            trend="up"
            icon={<DollarSign className="w-6 h-6 text-green-600" />}
            className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
          />
          
          <StatCard
            title="Low Stock"
            value={lowStockCount.toString()}
            change="Items need restocking"
            changeType="negative"
            trend="down"
            icon={<AlertTriangle className="w-6 h-6 text-yellow-600" />}
            className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200"
          />
          
          <StatCard
            title="Out of Stock"
            value={outOfStockCount.toString()}
            change="Items completely out"
            changeType="negative"
            trend="down"
            icon={<XCircle className="w-6 h-6 text-red-600" />}
            className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200"
          />
        </div>

        {/* Filters and Search */}
        <ModernCard>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search products by name or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="w-full md:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="w-full md:w-48">
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Stock Levels</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
                <option value="critical">Critical Priority</option>
              </select>
            </div>
            
            <Button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>
        </ModernCard>

        {/* Products Table */}
        <ModernCard>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Product</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">SKU</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Price</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Stock</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product._id} className={`border-b border-gray-100 hover:bg-gray-50 ${getRowHighlightClass(product)}`}>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Package2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">{product.name}</span>
                            {product.priority !== 'NORMAL' && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityBadge(product.priority)}`}>
                                {product.priority === 'CRITICAL' ? '🚨 Critical' : '⭐ Must Have'}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {product.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {product.sku || 'No SKU'}
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {product.category}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm font-medium text-gray-900">
                      J${product.unitPrice.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {product.isService ? 'Service' : product.stockQuantity}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        {getStockStatusIcon(product)}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockStatusColor(product)}`}>
                          {getStockStatus(product).replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingProduct(product)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteProduct(product._id)}
                          className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || selectedCategory 
                    ? 'Try adjusting your search criteria.' 
                    : 'Get started by adding your first product.'}
                </p>
                <Button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalProductsCount)} of {totalProductsCount} products
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1"
                >
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages, currentPage - 2 + i));
                    return pageNum;
                  }).filter((pageNum, index, array) => array.indexOf(pageNum) === index).map((pageNum) => (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="px-3 py-1 min-w-[40px]"
                    >
                      {pageNum}
                    </Button>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </ModernCard>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <ProductModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddProduct}
        />
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <ProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={handleEditProduct}
        />
      )}
    </div>
  );
}