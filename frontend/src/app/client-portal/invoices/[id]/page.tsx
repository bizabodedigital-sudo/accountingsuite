'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { clientPortalAPI, paymentGatewayAPI } from '@/lib/api';
import {
  ArrowLeft,
  Download,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2,
  CreditCard,
} from 'lucide-react';
import { PaymentGatewayModal } from '@/components/PaymentGatewayModal';

export default function ClientPortalInvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;
  
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    loadInvoice();
  }, [invoiceId]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const response = await clientPortalAPI.getInvoice(invoiceId);
      setInvoice(response.data.data);
    } catch (error: any) {
      if (error.response?.status === 401) {
        router.push('/client-portal/login');
      } else {
        console.error('Failed to load invoice:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `J$ ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const calculateSubtotal = () => {
    if (!invoice?.items) return 0;
    return invoice.items.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Invoice not found</p>
      </div>
    );
  }

  const subtotal = calculateSubtotal();
  const tax = invoice.tax || 0;
  const total = invoice.total || subtotal + tax;
  const isPaid = invoice.status === 'PAID';
  const isOverdue = invoice.status === 'SENT' && new Date(invoice.dueDate) < new Date();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.push('/client-portal/invoices')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Invoices
            </Button>
            <div className="flex gap-2">
              {!isPaid && (
                <Button
                  onClick={() => setShowPaymentModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay Now
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl mb-2">Invoice {invoice.number}</CardTitle>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Issue Date: {formatDate(invoice.issueDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Due Date: {formatDate(invoice.dueDate)}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                {isPaid ? (
                  <span className="px-4 py-2 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300 rounded-full text-sm font-medium flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Paid
                  </span>
                ) : isOverdue ? (
                  <span className="px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300 rounded-full text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Overdue
                  </span>
                ) : (
                  <span className="px-4 py-2 bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 rounded-full text-sm font-medium">
                    {invoice.status}
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Customer Info */}
            {invoice.customerId && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-semibold mb-2">Bill To:</h3>
                <p className="text-gray-900 dark:text-white">
                  {typeof invoice.customerId === 'object' ? invoice.customerId.name : 'Customer'}
                </p>
                {typeof invoice.customerId === 'object' && invoice.customerId.email && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {invoice.customerId.email}
                  </p>
                )}
              </div>
            )}

            {/* Items */}
            <div className="mb-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Description</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Quantity</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Unit Price</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items?.map((item: any, index: number) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900 dark:text-white">{item.description}</div>
                        {item.productName && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">{item.productName}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900 dark:text-white">{item.quantity || 1}</td>
                      <td className="py-3 px-4 text-right text-gray-900 dark:text-white">{formatCurrency(item.unitPrice || 0)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white">{formatCurrency(item.amount || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {tax > 0 && (
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Tax (GCT):</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span>Total:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-semibold mb-2">Notes:</h3>
                <p className="text-gray-700 dark:text-gray-300">{invoice.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {showPaymentModal && (
        <PaymentGatewayModal
          isOpen={showPaymentModal}
          invoiceId={invoiceId}
          amount={total}
          invoiceNumber={invoice.number}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowPaymentModal(false);
            loadInvoice();
          }}
        />
      )}
    </div>
  );
}

