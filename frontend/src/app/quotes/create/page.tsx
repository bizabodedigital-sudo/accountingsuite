'use client';

import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Save,
  Send,
  ArrowLeft,
  Loader2,
  Calendar
} from 'lucide-react';
import { quoteAPI, customerAPI, productAPI } from '@/lib/api';

interface QuoteItem {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  total: number;
}

export default function CreateQuotePage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Form state
  const [customerId, setCustomerId] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  });
  const [items, setItems] = useState<QuoteItem[]>([
    { description: '', quantity: 1, unitPrice: 0, total: 0 }
  ]);
  const [notes, setNotes] = useState('');
  const [taxType, setTaxType] = useState<string>('');
  const [customTaxRate, setCustomTaxRate] = useState<number | ''>('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadCustomers();
      loadProducts();
    }
  }, [isAuthenticated]);

  const loadCustomers = async () => {
    try {
      const response = await customerAPI.getCustomers();
      setCustomers(response.data.data || []);
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await productAPI.getProducts();
      setProducts(response.data.data || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof QuoteItem, value: any) => {
    const updated = [...items];
    if (field === 'productId') {
      const product = products.find(p => p._id === value);
      if (product) {
        updated[index].productId = product._id;
        updated[index].description = product.name;
        updated[index].unitPrice = product.price || 0;
        updated[index].quantity = 1;
      }
    } else {
      (updated[index] as any)[field] = value;
    }
    
    // Recalculate total
    updated[index].total = (updated[index].quantity || 0) * (updated[index].unitPrice || 0);
    setItems(updated);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
    let taxAmount = 0;
    
    if (taxType) {
      // Calculate tax based on tax type
      if (taxType === 'GCT_STANDARD') {
        taxAmount = subtotal * 0.15;
      } else if (taxType === 'GCT_ZERO') {
        taxAmount = 0;
      } else if (taxType === 'CUSTOM' && customTaxRate) {
        taxAmount = subtotal * (typeof customTaxRate === 'number' ? customTaxRate / 100 : (customTaxRate ? parseFloat(String(customTaxRate)) / 100 : 0));
      }
    }
    
    return {
      subtotal,
      taxAmount,
      total: subtotal + taxAmount
    };
  };

  const handleSave = async (status: 'DRAFT' | 'SENT' = 'DRAFT') => {
    if (!customerId) {
      alert('Please select a customer');
      return;
    }

    if (items.some(item => !item.description || item.quantity <= 0)) {
      alert('Please fill in all item details');
      return;
    }

    const { subtotal, taxAmount, total } = calculateTotals();

    try {
      setLoading(true);
      await quoteAPI.createQuote({
        customerId,
        items: items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate
        })),
        subtotal,
        taxType,
        taxRate: taxType === 'GCT_STANDARD' ? 15 : taxType === 'CUSTOM' ? (typeof customTaxRate === 'number' ? customTaxRate : (customTaxRate ? parseFloat(String(customTaxRate)) : 0)) : 0,
        taxAmount,
        customTaxRate: taxType === 'CUSTOM' ? (typeof customTaxRate === 'number' ? customTaxRate : (customTaxRate ? parseFloat(String(customTaxRate)) : undefined)) : undefined,
        total,
        issueDate,
        expiryDate,
        notes,
        status
      });
      
      router.push('/quotes');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create quote');
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header 
        onMenuClick={() => {}}
        title="Create Quote"
        subtitle="Create a new quote or estimate"
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Button
            variant="outline"
            onClick={() => router.push('/quotes')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Quotes
          </Button>

          <form className="space-y-6">
            {/* Customer & Dates */}
            <ModernCard title="Customer & Dates">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="customerId">Customer *</Label>
                  <select
                    id="customerId"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full mt-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  >
                    <option value="">Select customer</option>
                    {customers.map(cust => (
                      <option key={cust._id} value={cust._id}>
                        {cust.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="issueDate">Issue Date *</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="mt-2"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="expiryDate">Expiry Date *</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="mt-2"
                    required
                  />
                </div>
              </div>
            </ModernCard>

            {/* Items */}
            <ModernCard title="Items">
              <div className="space-y-4">
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium">Product/Description</th>
                        <th className="px-4 py-2 text-right text-xs font-medium">Quantity</th>
                        <th className="px-4 py-2 text-right text-xs font-medium">Unit Price</th>
                        <th className="px-4 py-2 text-right text-xs font-medium">Total</th>
                        <th className="px-4 py-2 text-center text-xs font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={index} className="border-t border-gray-200 dark:border-gray-600">
                          <td className="px-4 py-2">
                            <select
                              value={item.productId || ''}
                              onChange={(e) => updateItem(index, 'productId', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm mb-2"
                            >
                              <option value="">Select product or enter description</option>
                              {products.map(prod => (
                                <option key={prod._id} value={prod._id}>
                                  {prod.name} - ${prod.price?.toFixed(2)}
                                </option>
                              ))}
                            </select>
                            <Input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateItem(index, 'description', e.target.value)}
                              placeholder="Item description"
                              className="w-full text-sm"
                              required
                            />
                          </td>
                          <td className="px-4 py-2">
                            <Input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                              className="w-full text-sm text-right"
                              required
                            />
                          </td>
                          <td className="px-4 py-2">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="w-full text-sm text-right"
                              required
                            />
                          </td>
                          <td className="px-4 py-2 text-right font-semibold">
                            ${item.total.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {items.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(index)}
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={addItem}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </ModernCard>

            {/* Tax Settings */}
            <ModernCard title="Tax Settings">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="taxType">Tax Type</Label>
                  <select
                    id="taxType"
                    value={taxType}
                    onChange={(e) => {
                      setTaxType(e.target.value);
                      if (e.target.value !== 'CUSTOM') {
                        setCustomTaxRate('');
                      }
                    }}
                    className="w-full mt-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">No Tax</option>
                    <option value="GCT_STANDARD">GCT Standard (15%)</option>
                    <option value="GCT_ZERO">GCT Zero Rated</option>
                    <option value="CUSTOM">Custom Rate</option>
                  </select>
                </div>

                {taxType === 'CUSTOM' && (
                  <div>
                    <Label htmlFor="customTaxRate">Custom Tax Rate (%)</Label>
                    <Input
                      id="customTaxRate"
                      type="number"
                      step="0.01"
                      value={customTaxRate}
                      onChange={(e) => setCustomTaxRate(parseFloat(e.target.value) || '')}
                      className="mt-2"
                      placeholder="e.g., 10.5"
                    />
                  </div>
                )}
              </div>
            </ModernCard>

            {/* Totals */}
            <ModernCard title="Summary">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                  <span className="font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                {taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tax:</span>
                    <span className="font-semibold">${taxAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-lg font-bold">Total:</span>
                  <span className="text-lg font-bold">${total.toFixed(2)}</span>
                </div>
              </div>
            </ModernCard>

            {/* Notes */}
            <ModernCard title="Notes">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes or terms..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </ModernCard>

            {/* Actions */}
            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/quotes')}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSave('DRAFT')}
                disabled={loading}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
              <Button
                type="button"
                onClick={() => handleSave('SENT')}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Create & Send Quote
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

