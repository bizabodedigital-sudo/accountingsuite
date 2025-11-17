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
  DollarSign, 
  CreditCard, 
  Banknote, 
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { paymentAPI, invoiceAPI, paymentGatewayAPI } from '@/lib/api';
import PaymentGatewayModal from '@/components/PaymentGatewayModal';

export default function CreatePaymentPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [invoicePayments, setInvoicePayments] = useState<any[]>([]);
  
  // Form state
  const [invoiceId, setInvoiceId] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [reference, setReference] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [showGatewayModal, setShowGatewayModal] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadInvoices();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (invoiceId) {
      loadInvoiceDetails();
      loadInvoicePayments();
    }
  }, [invoiceId]);

  const loadInvoices = async () => {
    try {
      const response = await invoiceAPI.getInvoices({ status: 'SENT' });
      setInvoices(response.data.data || []);
    } catch (error) {
      console.error('Failed to load invoices:', error);
    }
  };

  const loadInvoiceDetails = async () => {
    try {
      const response = await invoiceAPI.getInvoice(invoiceId);
      setSelectedInvoice(response.data.data);
    } catch (error) {
      console.error('Failed to load invoice:', error);
    }
  };

  const loadInvoicePayments = async () => {
    try {
      const response = await paymentAPI.getPayments({ invoiceId });
      setInvoicePayments(response.data.data || []);
    } catch (error) {
      console.error('Failed to load payments:', error);
    }
  };

  const calculateRemainingBalance = () => {
    if (!selectedInvoice) return 0;
    const totalPaid = invoicePayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    return selectedInvoice.total - totalPaid;
  };

  const handleAmountChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    const remaining = calculateRemainingBalance();
    if (numValue > remaining) {
      setAmount(remaining);
    } else {
      setAmount(numValue || '');
    }
  };

  const handleFullPayment = () => {
    const remaining = calculateRemainingBalance();
    setAmount(remaining);
  };

  const handleStripePayment = async () => {
    if (!selectedInvoice || !amount) {
      alert('Please select an invoice and enter an amount');
      return;
    }

    try {
      setLoading(true);
      await paymentGatewayAPI.createStripeIntent({
        invoiceId: selectedInvoice._id
      });
      
      // In a real app, you'd redirect to Stripe Checkout or use Stripe Elements
      alert('Stripe payment integration - redirect to Stripe Checkout');
      // For now, we'll just create the payment manually
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create Stripe payment');
    } finally {
      setLoading(false);
    }
  };

  const handlePayPalPayment = async () => {
    if (!selectedInvoice || !amount) {
      alert('Please select an invoice and enter an amount');
      return;
    }

    try {
      setLoading(true);
      await paymentGatewayAPI.createPayPalOrder({
        invoiceId: selectedInvoice._id
      });
      
      // In a real app, you'd redirect to PayPal
      alert('PayPal payment integration - redirect to PayPal');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create PayPal order');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invoiceId || !amount || !paymentMethod) {
      alert('Please fill in all required fields');
      return;
    }

    const remaining = calculateRemainingBalance();
    const paymentAmount = typeof amount === 'number' ? amount : (amount ? parseFloat(String(amount)) : 0);
    
    if (paymentAmount > remaining) {
      alert(`Payment amount cannot exceed remaining balance of $${remaining.toFixed(2)}`);
      return;
    }

    try {
      setLoading(true);
      await paymentAPI.createPayment({
        invoiceId,
        amount: paymentAmount,
        paymentDate,
        paymentMethod,
        reference,
        transactionId
      });
      
      router.push('/payments');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create payment');
    } finally {
      setLoading(false);
    }
  };

  const remainingBalance = calculateRemainingBalance();
  const isPartial = selectedInvoice && remainingBalance > 0 && amount && typeof amount === 'number' && amount < remainingBalance;

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
        title="Record Payment"
        subtitle="Record a payment for an invoice"
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Button
            variant="outline"
            onClick={() => router.push('/payments')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Payments
          </Button>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Invoice Selection */}
            <ModernCard title="Select Invoice">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="invoiceId">Invoice *</Label>
                  <select
                    id="invoiceId"
                    value={invoiceId}
                    onChange={(e) => {
                      setInvoiceId(e.target.value);
                      setAmount('');
                    }}
                    className="w-full mt-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  >
                    <option value="">Select an invoice</option>
                    {invoices.map(inv => (
                      <option key={inv._id} value={inv._id}>
                        {inv.number} - {typeof inv.customerId === 'object' ? inv.customerId.name : 'Unknown'} - ${inv.total?.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedInvoice && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600 dark:text-gray-400">Invoice Total:</span>
                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          ${selectedInvoice.total?.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600 dark:text-gray-400">Total Paid:</span>
                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          ${invoicePayments.reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(2)}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium text-gray-600 dark:text-gray-400">Remaining Balance:</span>
                        <p className={`text-2xl font-bold ${remainingBalance > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                          ${remainingBalance.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {invoicePayments.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                        <p className="text-sm font-medium mb-2">Previous Payments:</p>
                        <div className="space-y-1">
                          {invoicePayments.map(payment => (
                            <div key={payment._id} className="flex justify-between text-sm">
                              <span>{new Date(payment.paymentDate).toLocaleDateString()} - {payment.paymentMethod}</span>
                              <span className="font-semibold">${payment.amount?.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ModernCard>

            {/* Payment Details */}
            <ModernCard title="Payment Details">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Amount *</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        className="flex-1"
                        required
                      />
                      {selectedInvoice && remainingBalance > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleFullPayment}
                          className="whitespace-nowrap"
                        >
                          Full Amount
                        </Button>
                      )}
                    </div>
                    {isPartial && (
                      <div className="mt-2 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                          <p className="text-sm text-orange-700 dark:text-orange-300">
                            Partial payment. Remaining balance: ${(remainingBalance - (typeof amount === 'number' ? amount : 0)).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="paymentDate">Payment Date *</Label>
                    <Input
                      id="paymentDate"
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="mt-2"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="paymentMethod">Payment Method *</Label>
                  <select
                    id="paymentMethod"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full mt-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  >
                    <option value="CASH">Cash</option>
                    <option value="CHECK">Check</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="DEBIT_CARD">Debit Card</option>
                    <option value="STRIPE">Stripe</option>
                    <option value="PAYPAL">PayPal</option>
                    <option value="WIPAY">WiPay</option>
                    <option value="LYNK">Lynk</option>
                    <option value="NCB">NCB</option>
                    <option value="JN">JN Bank</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="reference">Reference Number</Label>
                    <Input
                      id="reference"
                      type="text"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="Check number, transaction ID, etc."
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="transactionId">Transaction ID</Label>
                    <Input
                      id="transactionId"
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="Gateway transaction ID"
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>
            </ModernCard>

            {/* Payment Gateway Button */}
            {selectedInvoice && amount && (
              <ModernCard title="Online Payment">
                <div className="space-y-3">
                  <Button
                    type="button"
                    onClick={() => {
                      const paymentAmount = typeof amount === 'number' ? amount : parseFloat(String(amount));
                      const remaining = calculateRemainingBalance();
                      if (paymentAmount > remaining) {
                        alert(`Payment amount cannot exceed remaining balance of $${remaining.toFixed(2)}`);
                        return;
                      }
                      setShowGatewayModal(true);
                    }}
                    disabled={loading || !invoiceId || !amount}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pay Online (Stripe / PayPal)
                  </Button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    Choose your preferred payment gateway
                  </p>
                </div>
              </ModernCard>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/payments')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !invoiceId || !amount}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Recording...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Record Payment
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Payment Gateway Modal */}
      {showGatewayModal && invoiceId && amount && (
        <PaymentGatewayModal
          isOpen={showGatewayModal}
          onClose={() => setShowGatewayModal(false)}
          invoiceId={invoiceId}
          amount={typeof amount === 'number' ? amount : parseFloat(String(amount))}
          invoiceNumber={selectedInvoice?.number}
          onSuccess={() => {
            // Optionally reload or redirect after successful gateway payment
            // The webhook will handle the actual payment recording
            router.push('/payments');
          }}
        />
      )}
    </div>
  );
}

