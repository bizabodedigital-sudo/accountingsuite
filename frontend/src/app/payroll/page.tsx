'use client';

import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  DollarSign, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  Users,
  Calendar,
  FileText
} from 'lucide-react';
import { payrollAPI } from '@/lib/api';

export default function PayrollPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadPayrolls();
    }
  }, [isAuthenticated, statusFilter]);

  const loadPayrolls = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const response = await payrollAPI.getPayrolls(params);
      setPayrolls(response.data.data || []);
    } catch (error) {
      console.error('Failed to load payrolls:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      DRAFT: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', icon: Clock, label: 'Draft' },
      APPROVED: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: CheckCircle, label: 'Approved' },
      PAID: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: CheckCircle, label: 'Paid' },
      CANCELLED: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: XCircle, label: 'Cancelled' },
    };
    const config = statusConfig[status] || statusConfig.DRAFT;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const filteredPayrolls = payrolls.filter(payroll => {
    const matchesSearch = !searchTerm || 
      payroll.payrollNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (typeof payroll.employeeId === 'object' && 
       (payroll.employeeId?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payroll.employeeId?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())));
    return matchesSearch;
  });

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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        title="Payroll"
        subtitle="Manage employee payroll"
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Actions Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-1 gap-2 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search payroll..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="APPROVED">Approved</option>
              <option value="PAID">Paid</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <Button
            onClick={() => router.push('/payroll/create')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Payroll
          </Button>
        </div>

        {/* Payroll List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading payroll...</p>
          </div>
        ) : filteredPayrolls.length === 0 ? (
          <ModernCard className="p-12 text-center">
            <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No payroll records found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Get started by creating your first payroll record</p>
            <Button
              onClick={() => router.push('/payroll/create')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Payroll
            </Button>
          </ModernCard>
        ) : (
          <div className="grid gap-4">
            {filteredPayrolls.map((payroll) => (
              <ModernCard key={payroll._id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {payroll.payrollNumber || 'PR-001'}
                      </h3>
                      {getStatusBadge(payroll.status)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <div>
                        <span className="font-medium">Employee:</span>{' '}
                        {typeof payroll.employeeId === 'object' 
                          ? `${payroll.employeeId.firstName} ${payroll.employeeId.lastName}`
                          : 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Pay Date:</span>{' '}
                        {new Date(payroll.payDate).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Period:</span>{' '}
                        {new Date(payroll.payPeriodStart).toLocaleDateString()} - {new Date(payroll.payPeriodEnd).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Net Pay:</span>{' '}
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          ${payroll.netPay?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-xs text-gray-500 dark:text-gray-500 mt-2">
                      <div>
                        <span className="font-medium">Gross:</span> ${payroll.grossPay?.toFixed(2) || '0.00'}
                      </div>
                      <div>
                        <span className="font-medium">Deductions:</span> ${payroll.totalDeductions?.toFixed(2) || '0.00'}
                      </div>
                      <div>
                        <span className="font-medium">Posted:</span> {payroll.isPosted ? 'Yes' : 'No'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/payroll/${payroll._id}`)}
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {payroll.status === 'DRAFT' && user?.role !== 'STAFF' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (confirm('Approve this payroll?')) {
                            try {
                              await payrollAPI.approvePayroll(payroll._id);
                              loadPayrolls();
                            } catch (error: any) {
                              alert(error.response?.data?.error || 'Failed to approve payroll');
                            }
                          }
                        }}
                        title="Approve"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    )}
                    {payroll.status === 'APPROVED' && !payroll.isPosted && user?.role !== 'STAFF' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (confirm('Post this payroll to the ledger?')) {
                            try {
                              await payrollAPI.postPayroll(payroll._id);
                              loadPayrolls();
                            } catch (error: any) {
                              alert(error.response?.data?.error || 'Failed to post payroll');
                            }
                          }
                        }}
                        title="Post to Ledger"
                        className="text-purple-600 hover:text-purple-700"
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </ModernCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

