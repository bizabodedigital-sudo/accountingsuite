'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ModernCard } from '@/components/ui/modern-card';
import { X, CreditCard, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { paymentGatewayAPI } from '@/lib/api';

interface PaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string;
  amount: number;
  invoiceNumber?: string;
  onSuccess?: () => void;
}

export default function PaymentGatewayModal({
  isOpen,
  onClose,
  invoiceId,
  amount,
  invoiceNumber,
  onSuccess
}: PaymentGatewayModalProps) {
  const [selectedGateway, setSelectedGateway] = useState<'stripe' | 'paypal' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [approvalUrl, setApprovalUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setSelectedGateway(null);
      setError(null);
      setClientSecret(null);
      setPaymentIntentId(null);
      setOrderId(null);
      setApprovalUrl(null);
    }
  }, [isOpen]);

  const handleStripePayment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await paymentGatewayAPI.createStripeIntent({ invoiceId });
      
      if (response.data.success && response.data.data) {
        setClientSecret(response.data.data.clientSecret);
        setPaymentIntentId(response.data.data.paymentIntentId);
        setSelectedGateway('stripe');
        
        // In a real implementation, you would:
        // 1. Load Stripe.js
        // 2. Initialize Stripe Elements
        // 3. Handle payment confirmation
        // For now, we'll show a message that redirects to Stripe Checkout
        alert('Stripe payment intent created. In production, this would redirect to Stripe Checkout or show Stripe Elements.');
        
        // Simulate payment confirmation (in production, this would come from Stripe webhook)
        // For demo purposes, we'll just show success
        setTimeout(() => {
          handlePaymentSuccess('stripe', response.data.data.paymentIntentId);
        }, 2000);
      } else {
        setError(response.data.error || 'Failed to create Stripe payment intent');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to initialize Stripe payment');
    } finally {
      setLoading(false);
    }
  };

  const handlePayPalPayment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const returnUrl = `${window.location.origin}/payments?success=true`;
      const cancelUrl = `${window.location.origin}/payments/create?invoiceId=${invoiceId}`;
      
      const response = await paymentGatewayAPI.createPayPalOrder({
        invoiceId,
        returnUrl,
        cancelUrl
      });
      
      if (response.data.success && response.data.data) {
        setOrderId(response.data.data.orderId);
        setApprovalUrl(response.data.data.approvalUrl);
        setSelectedGateway('paypal');
        
        // In production, redirect to PayPal approval URL
        if (response.data.data.approvalUrl) {
          // For demo, we'll show an alert. In production, redirect:
          // window.location.href = response.data.data.approvalUrl;
          alert('PayPal order created. In production, this would redirect to PayPal for approval.');
          
          // Simulate payment capture (in production, this would come from PayPal callback)
          setTimeout(() => {
            handlePaymentSuccess('paypal', response.data.data.orderId);
          }, 2000);
        } else {
          setError('PayPal approval URL not received');
        }
      } else {
        setError(response.data.error || 'Failed to create PayPal order');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to initialize PayPal payment');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (gateway: 'stripe' | 'paypal', transactionId: string) => {
    try {
      setLoading(true);
      
      if (gateway === 'stripe') {
        await paymentGatewayAPI.confirmStripePayment({
          paymentIntentId: transactionId,
          invoiceId
        });
      } else if (gateway === 'paypal') {
        await paymentGatewayAPI.capturePayPalPayment({
          orderId: transactionId,
          invoiceId
        });
      }
      
      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to confirm payment');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <ModernCard className="max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Pay Online
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Invoice {invoiceNumber || invoiceId} - ${amount.toFixed(2)}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {!selectedGateway ? (
            <div className="space-y-3">
              <Button
                onClick={handleStripePayment}
                disabled={loading}
                className="w-full bg-[#635BFF] hover:bg-[#5851E6] text-white h-14 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span className="font-semibold">Pay with Stripe</span>
                  </>
                )}
              </Button>

              <Button
                onClick={handlePayPalPayment}
                disabled={loading}
                className="w-full bg-[#0070BA] hover:bg-[#005EA6] text-white h-14 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span className="font-semibold">Pay with PayPal</span>
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                Secure payment processing. Your payment information is encrypted.
              </p>
            </div>
          ) : selectedGateway === 'stripe' && clientSecret ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <p className="font-semibold text-blue-900 dark:text-blue-100">
                    Stripe Payment Intent Created
                  </p>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Payment Intent ID: {paymentIntentId}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  In production, Stripe Elements would be loaded here for card input.
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handlePaymentSuccess('stripe', paymentIntentId!)}
                  disabled={loading}
                  className="flex-1 bg-[#635BFF] hover:bg-[#5851E6] text-white"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    'Confirm Payment'
                  )}
                </Button>
              </div>
            </div>
          ) : selectedGateway === 'paypal' && approvalUrl ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <p className="font-semibold text-blue-900 dark:text-blue-100">
                    PayPal Order Created
                  </p>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Order ID: {orderId}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  In production, this would redirect to PayPal for approval.
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    // In production: window.location.href = approvalUrl;
                    handlePaymentSuccess('paypal', orderId!);
                  }}
                  disabled={loading}
                  className="flex-1 bg-[#0070BA] hover:bg-[#005EA6] text-white"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    'Complete Payment'
                  )}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </ModernCard>
    </div>
  );
}
