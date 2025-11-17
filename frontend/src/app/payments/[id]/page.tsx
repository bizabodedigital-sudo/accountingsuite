'use client';

import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  DollarSign, 
  ArrowLeft,
  RefreshCw,
  Download,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { paymentAPI } from '@/lib/api';

export default function PaymentDetailPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const paymentId = params?.id as string;
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState<number | ''>('');
  const [refundReason, setRefundReason] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && paymentId) {
      loadPayment();
    }
  }, [isAuthenticated, paymentId]);

  const loadPayment = async () => {
    try {
      setLoading(true);
      const response = await paymentAPI.getPayment(paymentId);
      setPayment(response.data.data);
      if (response.data.data) {
        setRefundAmount(response.data.data.amount);
      }
    } catch (error) {
      console.error('Failed to load payment:', error);
      alert('Failed to load payment');
      router.push('/payments');
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!refundAmount || (typeof refundAmount === 'number' ? refundAmount : parseFloat(String(refundAmount))) <= 0) {
      alert('Please enter a valid refund amount');
      return;
    }

    if (!confirm(`Refund $${(typeof refundAmount === 'number' ? refundAmount : parseFloat(String(refundAmount))).toFixed(2)}?`)) {
      return;
    }

    try {
      setProcessing(true);
      await paymentAPI.refundPayment(paymentId, {
        amount: typeof refundAmount === 'number' ? refundAmount : parseFloat(String(refundAmount)),
        reason: refundReason || undefined
      });
      loadPayment();
      setShowRefundModal(false);
      setRefundReason('');
      alert('Payment refunded successfully');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to refund payment');
    } finally {
      setProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading payment...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !payment) {
    return null;
  }

  const invoice = typeof payment.invoiceId === 'object' ? payment.invoiceId : null;
  const canRefund = payment.status === 'COMPLETED' && (payment.refundedAmount || 0) < payment.amount;

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header 
        onMenuClick={() => {}}
        title="Payment Details"
        subtitle={payment.paymentNumber || 'Payment'}
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              onClick={() => router.push('/payments')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Payments
            </Button>
            <div className="flex gap-2">
              {canRefund && user?.role !== 'STAFF' && (
                <Button
                  onClick={() => setShowRefundModal(true)}
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refund
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  // TODO: Generate receipt PDF
                  alert('Receipt generation coming soon');
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Receipt
              </Button>
            </div>
          </div>

          {/* Payment Header */}
          <ModernCard>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {payment.paymentNumber || 'PAY-001'}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Status: <span className={`font-semibold ${
                    payment.status === 'COMPLETED' ? 'text-green-600' :
                    payment.status === 'PENDING' ? 'text-yellow-600' :
                    payment.status === 'FAILED' ? 'text-red-600' :
                    payment.status === 'REFUNDED' ? 'text-orange-600' :
                    'text-gray-600'
                  }`}>{payment.status}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Amount</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  ${payment.amount?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </ModernCard>

          {/* Invoice Information */}
          {invoice && (
            <ModernCard title="Invoice Information">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Invoice Number:</span>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {invoice.number}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Invoice Total:</span>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    ${invoice.total?.toFixed(2) || '0.00'}
                  </p>
                </div>
                {payment.isPartial && (
                  <div className="col-span-2">
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        <p className="text-sm text-orange-700 dark:text-orange-300">
                          This is a partial payment. Remaining balance: ${payment.remainingBalance?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ModernCard>
          )}

          {/* Payment Details */}
          <ModernCard title="Payment Details">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Payment Date:</span>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {new Date(payment.paymentDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Payment Method:</span>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {payment.paymentMethod?.replace('_', ' ') || 'N/A'}
                </p>
              </div>
              {payment.reference && (
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Reference Number:</span>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {payment.reference}
                  </p>
                </div>
              )}
              {payment.transactionId && (
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Transaction ID:</span>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {payment.transactionId}
                  </p>
                </div>
              )}
            </div>
          </ModernCard>

          {/* Refund Information */}
          {payment.refundedAmount > 0 && (
            <ModernCard title="Refund Information">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Refunded Amount:</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    ${payment.refundedAmount?.toFixed(2) || '0.00'}
                  </span>
                </div>
                {payment.refundedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Refunded At:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {new Date(payment.refundedAt).toLocaleString()}
                    </span>
                  </div>
                )}
                {payment.refundReason && (
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Reason:</span>
                    <p className="text-gray-900 dark:text-gray-100 mt-1">{payment.refundReason}</p>
                  </div>
                )}
              </div>
            </ModernCard>
          )}

          {/* Notes */}
          {payment.notes && (
            <ModernCard title="Notes">
              <p className="text-gray-900 dark:text-gray-100">{payment.notes}</p>
            </ModernCard>
          )}

          {/* Refund Modal */}
          {showRefundModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <ModernCard className="max-w-md w-full">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Refund Payment</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowRefundModal(false);
                      setRefundReason('');
                    }}
                  >
                    ×
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="refundAmount">Refund Amount *</Label>
                    <Input
                      id="refundAmount"
                      type="number"
                      step="0.01"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(parseFloat(e.target.value) || '')}
                      className="mt-2"
                      max={payment.amount - (payment.refundedAmount || 0)}
                      required
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Maximum: ${(payment.amount - (payment.refundedAmount || 0)).toFixed(2)}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="refundReason">Reason (Optional)</Label>
                    <textarea
                      id="refundReason"
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="Reason for refund..."
                      rows={3}
                      className="w-full mt-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div className="flex gap-4 justify-end pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowRefundModal(false);
                        setRefundReason('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleRefund}
                      disabled={processing || !refundAmount}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Process Refund
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </ModernCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

