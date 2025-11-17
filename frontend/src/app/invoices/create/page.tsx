'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ModernCard } from '@/components/ui/modern-card';
import Header from '@/components/Header';
import {
  Plus,
  Trash2,
  Save,
  Send,
  Package,
  Calendar,
  MoreHorizontal,
  Eye,
  User,
  DollarSign,
  FileText,
  X,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { invoiceAPI, customerAPI, productAPI } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import InvoicePreview from '@/components/InvoicePreview';
import QuickClientModal from '@/components/QuickClientModal';
import QuickProductModal from '@/components/QuickProductModal';
import ProductSearch from '@/components/ProductSearch';

interface InvoiceItem {
  id: string;
  productId: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  taxRate: number;
  taxAmount: number;
}

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone: string;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  unitPrice: number;
  taxRate: number;
  unit: string;
}

export default function CreateInvoicePage() {
  const { user, tenant, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editInvoiceId = searchParams.get('edit');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form validation state
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

  // Form state
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [partialDeposit, setPartialDeposit] = useState(0);
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState(0);

  // Data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [taxRate, setTaxRate] = useState(15);
  const [taxAmount, setTaxAmount] = useState(0);
  const [total, setTotal] = useState(0);

  // Update calculations when items change
  useEffect(() => {
    const calculatedSubtotal = items.reduce((sum, item) => sum + item.total, 0);
    const calculatedTax = (calculatedSubtotal * taxRate) / 100;
    const calculatedTotal = calculatedSubtotal + calculatedTax;
    
    setSubtotal(calculatedSubtotal);
    setTaxAmount(calculatedTax);
    setTotal(calculatedTotal);
  }, [items, taxRate]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      loadCustomers();
      loadProducts();
    }

    // Default due date = 30 days later
    const due = new Date();
    due.setDate(due.getDate() + 30);
    setDueDate(due.toISOString().split('T')[0]);

  }, [isLoading, isAuthenticated]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Load invoice data for editing
  useEffect(() => {
    if (editInvoiceId && !isLoading && isAuthenticated) {
      loadInvoiceForEdit(editInvoiceId);
    }
  }, [editInvoiceId, isLoading, isAuthenticated]);

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

  const loadCustomers = async () => {
    try {
      console.log('🔄 Loading customers from API...');
      const response = await customerAPI.getCustomers();
      console.log('✅ Customers API response:', response);
      setCustomers(response.data.data || []);
      console.log('✅ Customers loaded from API:', response.data.data?.length || 0);
    } catch (err: any) {
      console.error('❌ Failed to load customers:', err);
      if (err.response?.status === 401) {
        setError('Please log in to access customer data');
        // Redirect to login after a delay
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError('Failed to load customers. Please check your connection.');
      }
    }
  };

  const loadProducts = async () => {
    try {
      console.log('🔄 Loading products from API...');
      const response = await productAPI.getProducts();
      console.log('✅ Products API response:', response);
      setProducts(response.data.data || []);
      console.log('✅ Products loaded from API:', response.data.data?.length || 0);
    } catch (err) {
      console.warn('⚠️ Failed to load products from API, using mock data:', err);
      // Fallback to mock products if API fails
      const mockProducts: Product[] = [
        { _id: '1', name: 'Web Development Services', description: 'Custom web application development', unitPrice: 15000, taxRate: 15, unit: 'HOUR' },
        { _id: '2', name: 'Mobile App Development', description: 'Cross-platform mobile application development', unitPrice: 20000, taxRate: 15, unit: 'HOUR' },
        { _id: '3', name: 'Software License - Microsoft Office', description: 'Annual Microsoft Office 365 Business license', unitPrice: 8500, taxRate: 15, unit: 'PIECE' },
        { _id: '4', name: 'Consulting Services', description: 'Business consulting and advisory services', unitPrice: 12000, taxRate: 15, unit: 'HOUR' },
        { _id: '5', name: 'Cloud Hosting', description: 'Monthly cloud hosting and infrastructure', unitPrice: 5000, taxRate: 15, unit: 'MONTH' }
      ];
      setProducts(mockProducts);
      console.log('✅ Using mock products:', mockProducts.length);
    }
  };

  const loadInvoiceForEdit = async (invoiceId: string) => {
    try {
      setLoading(true);
      const response = await invoiceAPI.getInvoice(invoiceId);
      const invoice = response.data.data;
      
      setIsEditing(true);
      setInvoiceNumber(invoice.number || '');
      setCustomerId(invoice.customerId._id || invoice.customerId);
      setSelectedCustomer(invoice.customerId);
      setItems(invoice.items || []);
      setSubtotal(invoice.subtotal || 0);
      setTaxRate(invoice.taxRate || 15);
      setTaxAmount(invoice.taxAmount || 0);
      setTotal(invoice.total || 0);
      setDueDate(invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '');
      setIssueDate(invoice.issueDate ? new Date(invoice.issueDate).toISOString().split('T')[0] : '');
      setNotes(invoice.notes || '');
      setPoNumber(invoice.poNumber || '');
      
      setSuccess('Invoice loaded for editing');
    } catch (err) {
      console.error('Failed to load invoice:', err);
      setError('Failed to load invoice for editing');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      productId: '',
      name: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
      taxRate: 15,
      taxAmount: 0,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          
          // Recalculate total when quantity or unitPrice changes
          if (['quantity', 'unitPrice'].includes(field)) {
            updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
          }
          
          return updatedItem;
        }
        return item;
      })
    );
  };

  // Handle product selection from search
  const handleProductSelect = (itemId: string, product: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            productId: product._id,
            name: product.name,
            description: product.description,
            unitPrice: product.unitPrice,
            taxRate: product.taxRate,
            total: item.quantity * product.unitPrice
          };
        }
        return item;
      })
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearAllItems = () => {
    if (items.length === 0) return;
    if (confirm('Are you sure you want to clear all items? This action cannot be undone.')) {
      setItems([]);
    }
  };

  const duplicateItem = (id: string) => {
    const itemToDuplicate = items.find(item => item.id === id);
    if (itemToDuplicate) {
      const duplicatedItem = {
        ...itemToDuplicate,
        id: Date.now().toString(),
        name: `${itemToDuplicate.name} (Copy)`,
      };
      setItems(prev => [...prev, duplicatedItem]);
    }
  };

  const handleClientCreated = (newClient: any) => {
    setCustomers(prev => [...prev, newClient]);
    setCustomerId(newClient._id);
    setShowClientModal(false);
  };

  const handleProductCreated = (newProduct: any) => {
    setProducts(prev => [...prev, newProduct]);
    setShowProductModal(false);
    
    // Auto-add the product to invoice items
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      productId: newProduct._id,
      name: newProduct.name,
      description: newProduct.description,
      quantity: 1,
      unitPrice: newProduct.unitPrice,
      total: newProduct.unitPrice,
      taxRate: newProduct.taxRate,
      taxAmount: 0,
    };
    setItems(prev => [...prev, newItem]);
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!customerId) {
      errors.customerId = 'Please select a customer';
    }
    if (items.length === 0) {
      errors.items = 'Please add at least one item';
    }
    if (!dueDate) {
      errors.dueDate = 'Please set a due date';
    }
    if (new Date(dueDate) < new Date()) {
      errors.dueDate = 'Due date cannot be in the past';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const invoiceData = {
        customerId,
        items: items.map(item => ({
          description: item.description || item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total
        })),
        subtotal,
        taxRate: taxRate,
        taxAmount: taxAmount,
        total,
        status: 'DRAFT',
        dueDate: new Date(dueDate),
        issueDate: new Date(issueDate),
        notes: notes || undefined,
        poNumber: poNumber || undefined
      };

      const response = await invoiceAPI.createInvoice(invoiceData);

      if (response.data.success) {
        setSuccess('Invoice saved as draft successfully!');
        setTimeout(() => {
          router.push('/invoices');
        }, 1500);
      } else {
        setError(response.data.error || 'Failed to save invoice');
      }
    } catch (err: any) {
      console.error('Save invoice error:', err);
      setError(err.response?.data?.error || 'Failed to save invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const invoiceData = {
        customerId,
        items: items.map(item => ({
          description: item.description || item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total
        })),
        subtotal,
        taxRate: taxRate,
        taxAmount: taxAmount,
        total,
        status: 'SENT',
        dueDate: new Date(dueDate),
        issueDate: new Date(issueDate),
        notes: notes || undefined,
        poNumber: poNumber || undefined
      };

      const response = await invoiceAPI.createInvoice(invoiceData);

      if (response.data.success) {
        setSuccess('Invoice sent successfully!');
        setTimeout(() => {
          router.push('/invoices');
        }, 1500);
      } else {
        setError(response.data.error || 'Failed to send invoice');
      }
    } catch (err: any) {
      console.error('Send invoice error:', err);
      setError(err.response?.data?.error || 'Failed to send invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Header 
        onMenuClick={() => {}}
        title={isEditing ? "Edit Invoice" : "Create Invoice"}
        subtitle={isEditing ? "Update invoice details and resend to client" : "Build professional invoices for your clients"}
        showSearch={false}
        showActions={false}
      />
      
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview(true)}
            disabled={items.length === 0}
          >
            <Eye className="mr-2 h-4 w-4" /> Preview
          </Button>
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={loading}
          >
            <Save className="mr-2 h-4 w-4" /> Save Draft
          </Button>
          <Button
            onClick={handleSend}
            disabled={items.length === 0 || loading}
          >
            <Send className="mr-2 h-4 w-4" /> Send Invoice
          </Button>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="h-5 w-5 bg-red-100 rounded-full flex items-center justify-center mr-2">
                <span className="text-red-600 text-xs font-bold">!</span>
              </div>
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        )}
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <div className="h-5 w-5 bg-green-100 rounded-full flex items-center justify-center mr-2">
                <span className="text-green-600 text-xs font-bold">✓</span>
              </div>
              <p className="text-green-800 text-sm">{success}</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-6">
            <div className="h-8 w-8 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 rounded-lg flex items-center justify-center mr-3">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Invoice Details</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Client Selection */}
            <div className="space-y-4">
              <Label className="text-sm font-black text-gray-800 uppercase tracking-widest">
                Bill To
              </Label>
              <div className="flex space-x-2">
                <div className="flex-1">
                  <select
                    value={customerId}
                    onChange={(e) => {
                      setCustomerId(e.target.value);
                      if (fieldErrors.customerId) {
                        setFieldErrors(prev => ({ ...prev, customerId: '' }));
                      }
                    }}
                    className={`w-full p-3 border rounded-lg focus:ring-blue-500 ${
                      fieldErrors.customerId 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-gray-200 focus:border-blue-500'
                    }`}
                  >
                    <option value="">Select a client...</option>
                    {customers.map((customer) => (
                      <option key={customer._id} value={customer._id}>
                        {customer.name} - {customer.email}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.customerId && (
                    <p className="text-red-600 text-sm mt-1 font-medium">{fieldErrors.customerId}</p>
                  )}
                </div>
                <Button
                  onClick={() => setShowClientModal(true)}
                  variant="outline"
                  className="border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50/50 text-blue-600 hover:text-blue-700 transition-all duration-300 px-4 py-3 font-semibold rounded-lg"
                  title="Add new client"
                >
                  <User className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Invoice Date */}
            <div className="space-y-4">
              <Label className="text-sm font-black text-gray-800 uppercase tracking-widest">
                Invoice Date
              </Label>
              <Input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="border-gray-200/60 focus:border-blue-500 focus:ring-blue-500/30 transition-all duration-300 bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl font-semibold"
              />
            </div>

            {/* Due Date */}
            <div className="space-y-4">
              <Label className="text-sm font-black text-gray-800 uppercase tracking-widest">
                Due Date
              </Label>
              <div>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value);
                    if (fieldErrors.dueDate) {
                      setFieldErrors(prev => ({ ...prev, dueDate: '' }));
                    }
                  }}
                  className={`border-gray-200/60 focus:ring-blue-500/30 transition-all duration-300 bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl font-semibold ${
                    fieldErrors.dueDate 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'focus:border-blue-500'
                  }`}
                />
                {fieldErrors.dueDate && (
                  <p className="text-red-600 text-sm mt-1 font-medium">{fieldErrors.dueDate}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Additional Details Section */}
          <div className="mt-8 pt-8 border-t border-gray-200/40">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Label className="text-sm font-black text-gray-800 uppercase tracking-widest">
                  PO Number (Optional)
                </Label>
                <Input
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  placeholder="Enter purchase order number"
                  className="border-gray-200/60 focus:border-blue-500 focus:ring-blue-500/30 transition-all duration-300 bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl font-semibold"
                />
              </div>
              <div className="space-y-4">
                <Label className="text-sm font-black text-gray-800 uppercase tracking-widest">
                  Notes (Optional)
                </Label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes or terms..."
                  rows={3}
                  className="w-full p-3 border border-gray-200/60 rounded-lg focus:border-blue-500 focus:ring-blue-500/30 transition-all duration-300 bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl font-semibold resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Items Card */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 rounded-lg flex items-center justify-center mr-3">
                <Package className="h-4 w-4 text-white" />
              </div>
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-bold text-gray-900">Invoice Items</h2>
                {items.length > 0 && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                    {items.length} item{items.length !== 1 ? 's' : ''}
                  </span>
                )}
                {fieldErrors.items && (
                  <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-semibold rounded-full">
                    {fieldErrors.items}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Ultra-Sleek Table Design */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead className="bg-gradient-to-r from-slate-50 via-gray-50 to-blue-50/50 border-b border-gray-200/40 sticky top-0 z-10">
                <tr>
                  <th className="text-left py-6 px-10 font-black text-gray-800 text-sm uppercase tracking-widest">
                    Description
                  </th>
                  <th className="text-center py-6 px-6 font-black text-gray-800 text-sm uppercase tracking-widest w-28">
                    Qty
                  </th>
                  <th className="text-right py-6 px-6 font-black text-gray-800 text-sm uppercase tracking-widest w-36">
                    Rate
                  </th>
                  <th className="text-right py-6 px-6 font-black text-gray-800 text-sm uppercase tracking-widest w-28">
                    Tax %
                  </th>
                  <th className="text-right py-6 px-10 font-black text-gray-800 text-sm uppercase tracking-widest w-36">
                    Amount
                  </th>
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/30">
                {items.length === 0 ? (
                  <tr key="empty-state">
                    <td colSpan={6} className="text-center py-20">
                      <div className="flex flex-col items-center space-y-6">
                        <div className="h-20 w-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center shadow-lg">
                          <Package className="h-10 w-10 text-gray-400" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">No items added</h3>
                          <p className="text-gray-500 mt-2 font-medium">Add items to your invoice to get started</p>
                        </div>
                        <Button
                          onClick={addItem}
                          className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-xl hover:shadow-2xl transition-all duration-300 px-8 py-3 font-semibold transform hover:scale-105"
                        >
                          <Plus className="mr-2 h-5 w-5" /> Add First Item
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-all duration-200 group">
                      <td className="py-6 px-8">
                        <div className="space-y-2">
                          {/* Product Search */}
                          <ProductSearch
                            products={products}
                            onProductSelect={(product) => handleProductSelect(item.id, product)}
                            placeholder="Search products..."
                            className="w-full"
                          />
                          
                          <Input
                            value={item.name}
                            onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                            placeholder="Item description..."
                            className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/30 transition-all duration-300 bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl font-semibold"
                          />
                          <Input
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            placeholder="Additional details..."
                            className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/30 transition-all duration-300 bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl font-semibold"
                          />
                        </div>
                      </td>
                      <td className="py-6 px-4">
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)
                          }
                          className="text-center border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 bg-white/50 backdrop-blur-sm font-semibold"
                        />
                      </td>
                      <td className="py-6 px-4">
                        <div className="flex items-center justify-end">
                          <span className="text-gray-500 text-sm mr-2 font-semibold">J$</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)
                            }
                            className="text-right border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 bg-white/50 backdrop-blur-sm font-semibold"
                          />
                        </div>
                      </td>
                      <td className="py-6 px-4">
                        <div className="flex items-center justify-end">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={item.taxRate}
                            onChange={(e) =>
                              updateItem(item.id, 'taxRate', parseFloat(e.target.value) || 0)
                            }
                            className="text-right border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 bg-white/50 backdrop-blur-sm w-16 font-semibold"
                          />
                          <span className="text-gray-500 text-sm ml-2 font-semibold">%</span>
                        </div>
                      </td>
                      <td className="py-6 px-8">
                        <div className="text-right">
                          <div className="font-bold text-gray-900 text-lg">
                            J${(item.total + item.taxAmount).toFixed(2)}
                          </div>
                          {item.taxAmount > 0 && (
                            <div className="text-xs text-gray-500 font-medium">
                              +J${item.taxAmount.toFixed(2)} tax
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-6 px-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => duplicateItem(item.id)}
                            className="text-gray-400 hover:text-blue-600 hover:bg-blue-50/80 transition-all duration-200 p-2 rounded-xl opacity-60 hover:opacity-100"
                            title="Duplicate item"
                            aria-label="Duplicate item"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm('Are you sure you want to remove this item?')) {
                                removeItem(item.id);
                              }
                            }}
                            className="text-gray-400 hover:text-red-600 hover:bg-red-50/80 transition-all duration-200 p-2 rounded-xl opacity-60 hover:opacity-100"
                            title="Remove item"
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              </table>
            </div>
            {/* Scroll indicator */}
            {items.length > 3 && (
              <div className="text-center py-2 text-xs text-gray-500 bg-gray-50/50 border-t border-gray-200/30">
                Scroll to see more items
              </div>
            )}
          </div>
          
          {/* Ultra-Sleek Add Item Button */}
          <div className="border-t border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-gray-100/30 px-8 py-6">
            <div className="flex space-x-4">
              <Button
                onClick={addItem}
                variant="outline"
                className="flex-1 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50/50 text-gray-600 hover:text-blue-600 transition-all duration-300 py-4 font-semibold rounded-xl"
              >
                <Plus className="mr-3 h-5 w-5" /> Add Item
              </Button>
              <Button
                onClick={() => setShowProductModal(true)}
                variant="outline"
                className="border-dashed border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50/50 text-emerald-600 hover:text-emerald-700 transition-all duration-300 py-4 px-6 font-semibold rounded-xl"
              >
                <Package className="mr-2 h-5 w-5" /> Quick Add Product
              </Button>
              {items.length > 0 && (
                <Button
                  onClick={clearAllItems}
                  variant="outline"
                  className="border-dashed border-red-300 hover:border-red-500 hover:bg-red-50/50 text-red-600 hover:text-red-700 transition-all duration-300 py-4 px-6 font-semibold rounded-xl"
                >
                  <Trash2 className="mr-2 h-5 w-5" /> Clear All
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Invoice Totals */}
        {items.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="max-w-md ml-auto space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-200/30">
                <span className="text-gray-600 font-semibold">Subtotal</span>
                <span className="font-bold text-gray-900 text-lg">J${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-200/30">
                <span className="text-gray-600 font-semibold">Tax ({taxRate}%)</span>
                <span className="font-bold text-gray-900 text-lg">J${taxAmount.toFixed(2)}</span>
              </div>
              <div className="pt-4">
                <div className="flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl">
                  <span className="text-xl font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                    J${total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Invoice Preview Modal */}
      {showPreview && (
        <InvoicePreview
          invoice={{
            number: invoiceNumber,
            customerId,
            issueDate,
            dueDate,
            items: items.map(item => ({
              description: item.description || item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total
            })),
            subtotal,
            taxRate,
            taxAmount: taxAmount,
            total,
            notes,
            poNumber
          }}
          customer={customers.find(c => c._id === customerId) || { _id: '', name: '', email: '' }}
          tenant={tenant || { name: 'Company', currency: 'JMD' }}
          onClose={() => setShowPreview(false)}
          onEdit={() => setShowPreview(false)}
          onSend={handleSend}
          onDownload={async () => {
            try {
              // Prepare invoice data
              const invoiceData = {
                customerId,
                items: items.map(item => ({
                  description: item.description || item.name,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  total: item.total
                })),
                subtotal,
                taxRate,
                taxAmount: taxAmount,
                total,
                status: 'DRAFT',
                dueDate: new Date(dueDate),
                issueDate: new Date(issueDate),
                notes: notes || undefined,
                poNumber: poNumber || undefined
              };

              let response;
              if (isEditing && editInvoiceId) {
                // Update existing invoice
                response = await invoiceAPI.updateInvoice(editInvoiceId, invoiceData);
              } else {
                // Create new invoice
                response = await invoiceAPI.createInvoice(invoiceData);
              }
              
              if (response.data.success) {
                // Download PDF using the created invoice ID
                const pdfResponse = await invoiceAPI.downloadPDF(response.data.data._id);
                
                // Since backend returns HTML, open it in a new window for printing
                const htmlContent = pdfResponse.data;
                const newWindow = window.open('', '_blank');
                if (newWindow) {
                  newWindow.document.write(htmlContent);
                  newWindow.document.close();
                  // Auto-print after content loads
                  newWindow.onload = () => {
                    setTimeout(() => {
                      newWindow.print();
                    }, 1000);
                  };
                }
                
                // Navigate to invoices list
                router.push('/invoices');
              }
            } catch (err: any) {
              console.error('PDF download error:', err);
              setError('Failed to generate PDF');
            }
          }}
        />
      )}

      {/* Quick Client Modal */}
      {showClientModal && (
        <QuickClientModal
          isOpen={showClientModal}
          onClose={() => setShowClientModal(false)}
          onClientCreated={handleClientCreated}
        />
      )}

      {/* Quick Product Modal */}
      {showProductModal && (
        <QuickProductModal
          isOpen={showProductModal}
          onClose={() => setShowProductModal(false)}
          onProductCreated={handleProductCreated}
        />
      )}
    </div>
  );
}
