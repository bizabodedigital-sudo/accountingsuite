'use client';

import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  FileText, 
  ArrowLeft,
  Edit,
  CheckCircle,
  ArrowRight,
  Download,
  Send,
  Loader2
} from 'lucide-react';
import { quoteAPI } from '@/lib/api';

export default function QuoteDetailPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const quoteId = params?.id as string;
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && quoteId) {
      loadQuote();
    }
  }, [isAuthenticated, quoteId]);

  const loadQuote = async () => {
    try {
      setLoading(true);
      const response = await quoteAPI.getQuote(quoteId);
      setQuote(response.data.data);
    } catch (error) {
      console.error('Failed to load quote:', error);
      alert('Failed to load quote');
      router.push('/quotes');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('Approve this quote?')) return;

    try {
      setProcessing(true);
      await quoteAPI.approveQuote(quoteId);
      loadQuote();
      alert('Quote approved successfully');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to approve quote');
    } finally {
      setProcessing(false);
    }
  };

  const handleConvert = async () => {
    if (!confirm('Convert this quote to an invoice?')) return;

    try {
      setProcessing(true);
      const response = await quoteAPI.convertQuote(quoteId);
      if (response.data.data?.invoice) {
        router.push(`/invoices/${response.data.data.invoice._id}`);
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to convert quote');
    } finally {
      setProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading quote...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !quote) {
    return null;
  }

  const customer = typeof quote.customerId === 'object' ? quote.customerId : null;
  const isExpired = new Date(quote.expiryDate) < new Date();

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header 
        onMenuClick={() => {}}
        title="Quote Details"
        subtitle={quote.number || 'Quote'}
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              onClick={() => router.push('/quotes')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Quotes
            </Button>
            <div className="flex gap-2">
              {quote.status === 'DRAFT' && (
                <Button
                  variant="outline"
                  onClick={() => router.push(`/quotes/${quoteId}/edit`)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
              {quote.status === 'SENT' && (
                <Button
                  onClick={handleApprove}
                  disabled={processing}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Approve
                </Button>
              )}
              {quote.status === 'APPROVED' && (
                <Button
                  onClick={handleConvert}
                  disabled={processing}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4 mr-2" />
                  )}
                  Convert to Invoice
                </Button>
              )}
            </div>
          </div>

          {/* Quote Header */}
          <ModernCard>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {quote.number || 'QUO-001'}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Status: <span className={`font-semibold ${
                    quote.status === 'APPROVED' ? 'text-green-600' :
                    quote.status === 'SENT' ? 'text-blue-600' :
                    quote.status === 'CONVERTED' ? 'text-purple-600' :
                    quote.status === 'EXPIRED' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>{quote.status}</span>
                </p>
              </div>
              {isExpired && quote.status !== 'CONVERTED' && (
                <div className="px-3 py-1 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm font-semibold text-red-700 dark:text-red-300">Expired</p>
                </div>
              )}
            </div>
          </ModernCard>

          {/* Customer Information */}
          <ModernCard title="Customer Information">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Customer:</span>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {customer?.name || 'Unknown'}
                </p>
              </div>
              {customer?.email && (
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Email:</span>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {customer.email}
                  </p>
                </div>
              )}
            </div>
          </ModernCard>

          {/* Dates */}
          <ModernCard title="Dates">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Issue Date:</span>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {new Date(quote.issueDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Expiry Date:</span>
                <p className={`font-semibold ${isExpired ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'}`}>
                  {new Date(quote.expiryDate).toLocaleDateString()}
                </p>
              </div>
              {quote.convertedToInvoiceId && (
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Converted To:</span>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {typeof quote.convertedToInvoiceId === 'object' 
                      ? quote.convertedToInvoiceId.number 
                      : 'Invoice'}
                  </p>
                </div>
              )}
            </div>
          </ModernCard>

          {/* Items */}
          <ModernCard title="Items">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium">Description</th>
                    <th className="px-4 py-2 text-right text-xs font-medium">Quantity</th>
                    <th className="px-4 py-2 text-right text-xs font-medium">Unit Price</th>
                    <th className="px-4 py-2 text-right text-xs font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.items?.map((item: any, index: number) => (
                    <tr key={index} className="border-t border-gray-200 dark:border-gray-700">
                      <td className="px-4 py-2">{item.description}</td>
                      <td className="px-4 py-2 text-right">{item.quantity}</td>
                      <td className="px-4 py-2 text-right">${item.unitPrice?.toFixed(2) || '0.00'}</td>
                      <td className="px-4 py-2 text-right font-semibold">${item.total?.toFixed(2) || '0.00'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ModernCard>

          {/* Totals */}
          <ModernCard title="Summary">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                <span className="font-semibold">${quote.subtotal?.toFixed(2) || '0.00'}</span>
              </div>
              {quote.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Tax ({quote.taxType === 'GCT_STANDARD' ? 'GCT 15%' : quote.taxRate + '%'}):
                  </span>
                  <span className="font-semibold">${quote.taxAmount?.toFixed(2) || '0.00'}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="font-bold text-lg">Total:</span>
                <span className="font-bold text-lg">${quote.total?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </ModernCard>

          {/* Notes */}
          {quote.notes && (
            <ModernCard title="Notes">
              <p className="text-gray-900 dark:text-gray-100">{quote.notes}</p>
            </ModernCard>
          )}
        </div>
      </div>
    </div>
  );
}

