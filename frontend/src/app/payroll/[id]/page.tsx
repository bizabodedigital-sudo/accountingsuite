'use client';

import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  DollarSign, 
  ArrowLeft,
  CheckCircle,
  FileText,
  Loader2,
  Lock,
  Unlock,
  CreditCard
} from 'lucide-react';
import { payrollAPI } from '@/lib/api';

export default function PayrollDetailPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const payrollId = params?.id as string;
  const [payroll, setPayroll] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && payrollId) {
      loadPayroll();
    }
  }, [isAuthenticated, payrollId]);

  const loadPayroll = async () => {
    try {
      setLoading(true);
      const response = await payrollAPI.getPayroll(payrollId);
      setPayroll(response.data.data);
    } catch (error) {
      console.error('Failed to load payroll:', error);
      alert('Failed to load payroll');
      router.push('/payroll');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('Approve this payroll record?')) return;

    try {
      setProcessing(true);
      await payrollAPI.approvePayroll(payrollId);
      loadPayroll();
      alert('Payroll approved successfully');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to approve payroll');
    } finally {
      setProcessing(false);
    }
  };

  const handlePost = async () => {
    if (!confirm('Post this payroll to the ledger? This will create journal entries.')) return;

    try {
      setProcessing(true);
      await payrollAPI.postPayroll(payrollId);
      loadPayroll();
      alert('Payroll posted to ledger successfully');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to post payroll');
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!confirm('Mark this payroll as paid?')) return;

    try {
      setProcessing(true);
      await payrollAPI.markPayrollPaid(payrollId);
      loadPayroll();
      alert('Payroll marked as paid');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to mark payroll as paid');
    } finally {
      setProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading payroll...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !payroll) {
    return null;
  }

  const employee = typeof payroll.employeeId === 'object' ? payroll.employeeId : null;

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header 
        onMenuClick={() => {}}
        title="Payroll Details"
        subtitle={payroll.payrollNumber || 'Payroll Record'}
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Button
            variant="outline"
            onClick={() => router.push('/payroll')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Payroll
          </Button>

          {/* Status & Actions */}
          <ModernCard>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {payroll.payrollNumber}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Status: <span className={`font-semibold ${
                    payroll.status === 'PAID' ? 'text-green-600' :
                    payroll.status === 'APPROVED' ? 'text-blue-600' :
                    'text-gray-600'
                  }`}>{payroll.status}</span>
                </p>
              </div>
              <div className="flex gap-2">
                {payroll.status === 'DRAFT' && user?.role !== 'STAFF' && (
                  <Button
                    onClick={handleApprove}
                    disabled={processing}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {processing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Approve
                  </Button>
                )}
                {payroll.status === 'APPROVED' && !payroll.isPosted && user?.role !== 'STAFF' && (
                  <Button
                    onClick={handlePost}
                    disabled={processing}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {processing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4 mr-2" />
                    )}
                    Post to Ledger
                  </Button>
                )}
                {payroll.status === 'APPROVED' && user?.role !== 'STAFF' && (
                  <Button
                    onClick={handleMarkPaid}
                    disabled={processing}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {processing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4 mr-2" />
                    )}
                    Mark as Paid
                  </Button>
                )}
              </div>
            </div>
          </ModernCard>

          {/* Employee Information */}
          <ModernCard title="Employee Information">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Employee:</span>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {employee ? `${employee.firstName} ${employee.lastName}` : 'N/A'}
                </p>
              </div>
              {employee && (
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Employee #:</span>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {employee.employeeNumber}
                  </p>
                </div>
              )}
            </div>
          </ModernCard>

          {/* Pay Period */}
          <ModernCard title="Pay Period">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Period Start:</span>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {new Date(payroll.payPeriodStart).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Period End:</span>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {new Date(payroll.payPeriodEnd).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Pay Date:</span>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {new Date(payroll.payDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </ModernCard>

          {/* Earnings */}
          <ModernCard title="Earnings">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Base Salary:</span>
                <span className="font-semibold">${payroll.baseSalary?.toFixed(2) || '0.00'}</span>
              </div>
              {payroll.overtimeHours > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Overtime ({payroll.overtimeHours} hrs @ ${payroll.overtimeRate?.toFixed(2)}/hr):
                  </span>
                  <span className="font-semibold">${payroll.overtimeAmount?.toFixed(2) || '0.00'}</span>
                </div>
              )}
              {payroll.bonuses > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Bonuses:</span>
                  <span className="font-semibold">${payroll.bonuses?.toFixed(2) || '0.00'}</span>
                </div>
              )}
              {payroll.allowances > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Allowances:</span>
                  <span className="font-semibold">${payroll.allowances?.toFixed(2) || '0.00'}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="font-bold text-lg">Gross Pay:</span>
                <span className="font-bold text-lg text-green-600 dark:text-green-400">
                  ${payroll.grossPay?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          </ModernCard>

          {/* Deductions */}
          <ModernCard title="Deductions">
            <div className="space-y-2">
              {payroll.nis > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">NIS:</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    ${payroll.nis?.toFixed(2) || '0.00'}
                  </span>
                </div>
              )}
              {payroll.nht > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">NHT:</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    ${payroll.nht?.toFixed(2) || '0.00'}
                  </span>
                </div>
              )}
              {payroll.educationTax > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Education Tax:</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    ${payroll.educationTax?.toFixed(2) || '0.00'}
                  </span>
                </div>
              )}
              {payroll.incomeTax > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Income Tax:</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    ${payroll.incomeTax?.toFixed(2) || '0.00'}
                  </span>
                </div>
              )}
              {payroll.pension > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Pension:</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    ${payroll.pension?.toFixed(2) || '0.00'}
                  </span>
                </div>
              )}
              {payroll.healthInsurance > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Health Insurance:</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    ${payroll.healthInsurance?.toFixed(2) || '0.00'}
                  </span>
                </div>
              )}
              {payroll.otherDeductions > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Other Deductions:</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    ${payroll.otherDeductions?.toFixed(2) || '0.00'}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="font-bold text-lg text-red-600 dark:text-red-400">Total Deductions:</span>
                <span className="font-bold text-lg text-red-600 dark:text-red-400">
                  ${payroll.totalDeductions?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          </ModernCard>

          {/* Summary */}
          <ModernCard title="Summary">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">Net Pay:</span>
                <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                  ${payroll.netPay?.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Payment Method:</span>
                  <p className="font-semibold">{payroll.paymentMethod?.replace('_', ' ') || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Posted to Ledger:</span>
                  <p className="font-semibold">{payroll.isPosted ? 'Yes' : 'No'}</p>
                </div>
                {payroll.postedAt && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Posted At:</span>
                    <p className="font-semibold">{new Date(payroll.postedAt).toLocaleString()}</p>
                  </div>
                )}
                {payroll.approvedBy && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Approved By:</span>
                    <p className="font-semibold">
                      {typeof payroll.approvedBy === 'object' 
                        ? `${payroll.approvedBy.firstName} ${payroll.approvedBy.lastName}`
                        : 'N/A'}
                    </p>
                  </div>
                )}
              </div>
              {payroll.notes && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Notes:</span>
                  <p className="text-gray-900 dark:text-gray-100 mt-1">{payroll.notes}</p>
                </div>
              )}
            </div>
          </ModernCard>
        </div>
      </div>
    </div>
  );
}

