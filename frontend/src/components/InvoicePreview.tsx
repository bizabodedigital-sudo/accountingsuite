'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ModernCard } from '@/components/ui/modern-card';
import { X, Download, Send, Edit, FileText } from 'lucide-react';

interface InvoicePreviewProps {
  invoice: {
    number?: string;
    customerId: string;
    issueDate: string;
    dueDate: string;
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    notes?: string;
    poNumber?: string;
  };
  customer: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string | {
      street?: string;
      city?: string;
      parish?: string;
      country?: string;
    };
  };
  tenant: {
    name: string;
    currency: string;
    settings?: {
      address?: string;
      phone?: string;
      email?: string;
      website?: string;
    };
  };
  onClose: () => void;
  onEdit: () => void;
  onSend: () => void;
  onDownload: () => void;
}

export default function InvoicePreview({
  invoice,
  customer,
  tenant,
  onClose,
  onEdit,
  onSend,
  onDownload
}: InvoicePreviewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-JM', {
      style: 'currency',
      currency: tenant.currency || 'JMD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-JM', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Invoice Preview</h2>
                <p className="text-gray-600 text-sm">Review before sending</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onDownload} className="border-gray-200 hover:bg-gray-50">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="outline" onClick={onEdit} className="border-gray-200 hover:bg-gray-50">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button onClick={onSend} className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <Send className="w-4 h-4 mr-2" />
                Send Invoice
              </Button>
              <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl p-2">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
          <div className="max-w-4xl mx-auto">
            {/* Company Header */}
            <div className="mb-8">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{tenant.name}</h1>
                  {tenant.settings?.address && (
                    <p className="text-gray-600 mt-2">{tenant.settings.address}</p>
                  )}
                  <div className="flex space-x-4 mt-2 text-sm text-gray-600">
                    {tenant.settings?.phone && <span>Tel: {tenant.settings.phone}</span>}
                    {tenant.settings?.email && <span>Email: {tenant.settings.email}</span>}
                    {tenant.settings?.website && <span>Web: {tenant.settings.website}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
                  {invoice.number && (
                    <p className="text-gray-600 mt-1">#{invoice.number}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Bill To:</h3>
                <div className="text-gray-700">
                  <p className="font-medium">{customer.name}</p>
                  <p>{customer.email}</p>
                  {customer.phone && <p>{customer.phone}</p>}
                  {customer.address && (
                    <p>
                      {typeof customer.address === 'string' 
                        ? customer.address 
                        : `${customer.address.street || ''}, ${customer.address.city || ''}, ${customer.address.parish || ''}, ${customer.address.country || ''}`.replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '')
                      }
                    </p>
                  )}
                </div>
              </div>
              <div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-900">Invoice Date:</p>
                    <p className="text-gray-700">{formatDate(invoice.issueDate)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Due Date:</p>
                    <p className="text-gray-700">{formatDate(invoice.dueDate)}</p>
                  </div>
                  {invoice.poNumber && (
                    <div>
                      <p className="font-medium text-gray-900">PO Number:</p>
                      <p className="text-gray-700">{invoice.poNumber}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Description</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">Qty</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">Unit Price</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-gray-700">{item.description}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{item.quantity}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-3 px-4 text-right text-gray-700 font-medium">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className="w-80">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">Tax ({invoice.taxRate}%):</span>
                  <span className="font-medium">{formatCurrency(invoice.taxAmount)}</span>
                </div>
                <div className="flex justify-between py-3 bg-gray-50 px-4 rounded">
                  <span className="font-bold text-lg text-gray-900">Total:</span>
                  <span className="font-bold text-lg text-gray-900">{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="mb-8">
                <h3 className="font-semibold text-gray-900 mb-2">Notes:</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="text-center text-sm text-gray-500 border-t pt-4">
              <p>Thank you for your business!</p>
              {tenant.settings?.website && (
                <p className="mt-1">Visit us at {tenant.settings.website}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

