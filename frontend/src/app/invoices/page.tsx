'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModernCard, StatCard } from '@/components/ui/modern-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Header from '@/components/Header';
import { 
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Send,
  DollarSign,
  Calendar,
  User,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
  Repeat,
  Play,
  Pause,
  Settings,
  Trash2,
  Copy,
  Zap,
  CalendarDays,
  Timer,
  Mail,
  Bell,
} from 'lucide-react';
import { invoiceAPI, recurringInvoiceAPI, paymentReminderAPI } from '@/lib/api';
import { Invoice, RecurringInvoice } from '@/types';

export default function InvoicesPage() {
  const { isAuthenticated, tenant } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [activeTab, setActiveTab] = useState<'invoices' | 'recurring'>('invoices');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoice[]>([]);
  const [recurringLoading, setRecurringLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchInvoices();
      fetchRecurringInvoices();
    }
  }, [isAuthenticated, currentPage]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await invoiceAPI.getInvoices({
        page: currentPage,
        limit: 10,
        status: filterStatus !== 'All' ? filterStatus : undefined
      });
      setInvoices(res.data.data);
      setTotalPages(res.data.pagination?.pages || 1);
      setTotalInvoices(res.data.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
      // Error handling - could add error state if needed
    } finally {
      setLoading(false);
    }
  };

  const fetchRecurringInvoices = async () => {
    try {
      setRecurringLoading(true);
      const res = await recurringInvoiceAPI.getRecurringInvoices({
        page: 1,
        limit: 100 // Get all recurring invoices for now
      });
      setRecurringInvoices(res.data.data);
    } catch (err) {
      console.error('Failed to fetch recurring invoices:', err);
      // Don't set error for recurring invoices as it's not critical
    } finally {
      setRecurringLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'SENT':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'DRAFT':
      case 'CANCELLED':
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle className="w-4 h-4" />;
      case 'SENT':
        return <Send className="w-4 h-4" />;
      case 'OVERDUE':
        return <AlertCircle className="w-4 h-4" />;
      case 'CANCELLED':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  // Check if invoice is overdue
  const isOverdue = (invoice: Invoice) => {
    if (invoice.status === 'PAID' || invoice.status === 'CANCELLED') {
      return false;
    }
    const today = new Date();
    const dueDate = new Date(invoice.dueDate);
    return dueDate < today;
  };

  // Get effective status (considering overdue)
  const getEffectiveStatus = (invoice: Invoice) => {
    if (isOverdue(invoice)) {
      return 'OVERDUE';
    }
    return invoice.status;
  };

  // Get row highlighting for overdue invoices
  const getRowHighlightClass = (invoice: Invoice) => {
    if (isOverdue(invoice)) {
      return 'bg-red-50 border-l-4 border-red-500';
    }
    return '';
  };

  const formatCurrency = (amt: number) =>
    new Intl.NumberFormat('en-JM', { style: 'currency', currency: 'JMD' }).format(amt);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-JM');

  const toggleRecurringStatus = async (id: string) => {
    try {
      await recurringInvoiceAPI.toggleStatus(id);
      // Refresh the list
      fetchRecurringInvoices();
    } catch (err) {
      console.error('Failed to toggle recurring invoice status:', err);
    }
  };

  const deleteRecurringInvoice = async (id: string) => {
    try {
      await recurringInvoiceAPI.deleteRecurringInvoice(id);
      // Refresh the list
      fetchRecurringInvoices();
    } catch (err) {
      console.error('Failed to delete recurring invoice:', err);
    }
  };

  const duplicateRecurringInvoice = async (id: string) => {
    try {
      await recurringInvoiceAPI.duplicateRecurringInvoice(id);
      // Refresh the list
      fetchRecurringInvoices();
    } catch (err) {
      console.error('Failed to duplicate recurring invoice:', err);
    }
  };

  const generateInvoiceFromRecurring = async (id: string) => {
    try {
      await recurringInvoiceAPI.generateInvoice(id);
      // Refresh both lists
      fetchInvoices();
      fetchRecurringInvoices();
    } catch (err) {
      console.error('Failed to generate invoice from recurring:', err);
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const s = search.toLowerCase();
    const matchSearch =
      inv.number.toLowerCase().includes(s) ||
      (typeof inv.customerId === 'object'
        ? inv.customerId.name.toLowerCase().includes(s)
        : 'customer'.includes(s));
    
    let matchStatus = true;
    if (filterStatus === 'OVERDUE') {
      matchStatus = isOverdue(inv);
    } else if (filterStatus !== 'All') {
      matchStatus = inv.status === filterStatus;
    }
    
    return matchSearch && matchStatus;
  });

  const totalInvoicesCount = invoices.length;
  const paidInvoices = invoices.filter(i => i.status === 'PAID').length;
  const overdueInvoices = invoices.filter(i => isOverdue(i)).length;
  const totalRevenue = invoices
    .filter(i => i.status === 'PAID')
    .reduce((s, i) => s + i.total, 0);
  const pendingRevenue = invoices
    .filter(i => ['SENT', 'DRAFT'].includes(i.status))
    .reduce((s, i) => s + i.total, 0);
  const overdueRevenue = invoices
    .filter(i => isOverdue(i))
    .reduce((s, i) => s + i.total, 0);
  const statuses = ['All', ...new Set(invoices.map(i => i.status))];

  // Redirect to edit page when editing invoice
  useEffect(() => {
    if (editingInvoice) {
      window.location.href = `/invoices/create?edit=${editingInvoice._id}`;
    }
  }, [editingInvoice]);

  if (!isAuthenticated)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in</h1>
          <Button asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    );

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <Header
        onMenuClick={() => {}}
        title="Invoice Management"
        subtitle={`Create, track, and manage invoices for ${tenant?.name || 'your business'}`}
        showSearch={false}
      />

      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Top Controls */}
        <div className="flex space-x-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" /> Filter
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button asChild>
            <Link href="/invoices/create">
              <Plus className="mr-2 h-4 w-4" /> Create Invoice
            </Link>
          </Button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-white">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'invoices'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Invoices</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('recurring')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'recurring'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Repeat className="w-4 h-4" />
                <span>Recurring</span>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                  {recurringInvoices.length}
                </span>
              </div>
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {activeTab === 'invoices' ? (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Invoices"
                  value={totalInvoices.toString()}
                  change={`${paidInvoices} paid, ${overdueInvoices} overdue`}
                  changeType="neutral"
                  icon={<FileText className="w-6 h-6 text-blue-600" />}
                  className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200"
                />
                <StatCard
                  title="Total Revenue"
                  value={formatCurrency(totalRevenue)}
                  change="From paid invoices"
                  changeType="positive"
                  icon={<DollarSign className="w-6 h-6 text-green-600" />}
                  className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
                />
                <StatCard
                  title="Pending Revenue"
                  value={formatCurrency(pendingRevenue)}
                  change="Awaiting payment"
                  changeType="neutral"
                  icon={<Clock className="w-6 h-6 text-orange-600" />}
                  className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200"
                />
                <StatCard
                  title="Overdue Invoices"
                  value={overdueInvoices.toString()}
                  change={`${formatCurrency(overdueRevenue)} at risk`}
                  changeType={overdueInvoices > 0 ? 'negative' : 'positive'}
                  icon={<AlertCircle className="w-6 h-6 text-red-600" />}
                  className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200"
                />
              </div>

              {/* Search + Filter */}
              <ModernCard className="p-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                  <div className="relative w-full md:w-1/2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search invoices by number or customer..."
                      className="pl-9"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="w-full md:w-auto">
                    <select
                      className="border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                      value={filterStatus}
                      onChange={e => setFilterStatus(e.target.value)}
                    >
                      {statuses.map(s => (
                        <option key={s} value={s}>
                          {s === 'All' ? 'All Statuses' : s}
                        </option>
                      ))}
                      <option value="OVERDUE">Overdue</option>
                    </select>
                  </div>
                </div>
              </ModernCard>

              {/* Invoices Table */}
              <ModernCard title="Invoice Records" description="All your invoices and their current status.">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                    <p className="mt-4 text-gray-600">Loading invoices...</p>
                  </div>
                ) : filteredInvoices.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">
                      No invoices found
                    </h3>
                    <p className="mt-2 text-gray-600">
                      Get started by creating your first invoice
                    </p>
                    <Button asChild className="mt-4">
                      <Link href="/invoices/create">
                        <Plus className="mr-2 h-4 w-4" /> Create Invoice
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Issue Date</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredInvoices.map(inv => (
                          <TableRow key={inv._id} className={`hover:bg-gray-50 h-16 ${getRowHighlightClass(inv)}`}>
                            <TableCell className="py-4">
                              <div className="flex items-center space-x-3">
                                <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                                  <FileText className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{inv.number}</div>
                                  <div className="text-sm text-gray-500">Invoice</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="flex items-center space-x-3">
                                <div className="h-8 w-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                                  <User className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {typeof inv.customerId === 'object'
                                      ? inv.customerId.name
                                      : 'Customer'}
                                  </div>
                                  <div className="text-sm text-gray-500">Client</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <span
                                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(
                                  getEffectiveStatus(inv)
                                )}`}
                              >
                                {getStatusIcon(getEffectiveStatus(inv))}
                                <span className="ml-1.5">{getEffectiveStatus(inv)}</span>
                              </span>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="text-right">
                                <div className="font-semibold text-gray-900 text-lg">
                                  {formatCurrency(inv.total)}
                                </div>
                                <div className="text-sm text-gray-500">Total Amount</div>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {formatDate(inv.issueDate)}
                                  </div>
                                  <div className="text-xs text-gray-500">Issue Date</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {formatDate(inv.dueDate)}
                                  </div>
                                  <div className="text-xs text-gray-500">Due Date</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-4 text-right">
                              <div className="flex justify-end space-x-1">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0"
                                  onClick={() => setEditingInvoice(inv)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                {inv.status === 'DRAFT' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  >
                                    <Send className="w-4 h-4" />
                                  </Button>
                                )}
                                {(inv.status === 'SENT' || isOverdue(inv)) && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                    onClick={async () => {
                                      if (confirm(`Send payment reminder for invoice ${inv.number}?`)) {
                                        try {
                                          await paymentReminderAPI.sendReminder(inv._id, isOverdue(inv) ? 'OVERDUE' : 'STANDARD');
                                          alert('Payment reminder sent successfully!');
                                        } catch (err: any) {
                                          alert(err.response?.data?.error || 'Failed to send reminder');
                                        }
                                      }
                                    }}
                                    title="Send Payment Reminder"
                                  >
                                    <Bell className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                        <div className="text-sm text-gray-700">
                          Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalInvoices)} of {totalInvoices} invoices
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1"
                          >
                            Previous
                          </Button>
                          
                          <div className="flex items-center space-x-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              const pageNum = Math.max(1, Math.min(totalPages, currentPage - 2 + i));
                              return pageNum;
                            }).filter((pageNum, index, array) => array.indexOf(pageNum) === index).map((pageNum) => (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                className="px-3 py-1 min-w-[40px]"
                              >
                                {pageNum}
                              </Button>
                            ))}
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ModernCard>
            </>
          ) : (
            <>
              {/* Recurring Invoices Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Active Recurring"
                  value={recurringInvoices.filter(r => r.status === 'ACTIVE').length.toString()}
                  change="Currently running"
                  changeType="positive"
                  icon={<Zap className="w-6 h-6 text-green-600" />}
                  className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
                />
                <StatCard
                  title="Paused Recurring"
                  value={recurringInvoices.filter(r => r.status === 'PAUSED').length.toString()}
                  change="Temporarily stopped"
                  changeType="neutral"
                  icon={<Pause className="w-6 h-6 text-orange-600" />}
                  className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200"
                />
                <StatCard
                  title="Total Generated"
                  value={recurringInvoices.reduce((s, r) => s + r.totalGenerated, 0).toString()}
                  change="Invoices created"
                  changeType="neutral"
                  icon={<FileText className="w-6 h-6 text-blue-600" />}
                  className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200"
                />
                <StatCard
                  title="Next Run"
                  value="3"
                  change="Scheduled for this week"
                  changeType="neutral"
                  icon={<CalendarDays className="w-6 h-6 text-purple-600" />}
                  className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200"
                />
              </div>

              {/* Recurring Table */}
              <ModernCard
                title="Recurring Invoices"
                description="Automated invoice generation with customizable schedules and timelines."
              >
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Next Run</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Generated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recurringInvoices.map(r => (
                        <TableRow key={r._id} className="hover:bg-gray-50 h-16">
                          <TableCell className="py-4">
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                                <Repeat className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{r.name}</div>
                                <div className="text-sm text-gray-500">{r.description || 'No description'}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center space-x-3">
                              <div className="h-8 w-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <div className='font-medium text-gray-900'>
                                  {typeof r.customerId === 'object' ? r.customerId.name : 'Customer'}
                                </div>
                                <div className="text-sm text-gray-500">Client</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="text-right">
                              <div className="font-semibold text-gray-900 text-lg">
                                {formatCurrency(r.total)}
                              </div>
                              <div className="text-sm text-gray-500">{r.frequency}</div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="text-center">
                              <div className="font-medium text-gray-900">{formatDate(r.nextRunDate)}</div>
                              <div className="text-sm text-gray-500">Next Run</div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <span
                              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${
                                r.status === 'ACTIVE'
                                  ? 'bg-green-100 text-green-800 border-green-200'
                                  : r.status === 'PAUSED'
                                  ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                  : 'bg-gray-100 text-gray-800 border-gray-200'
                              }`}
                            >
                              {r.status === 'ACTIVE' ? (
                                <CheckCircle className="w-3 h-3 mr-1.5" />
                              ) : r.status === 'PAUSED' ? (
                                <Pause className="w-3 h-3 mr-1.5" />
                              ) : (
                                <XCircle className="w-3 h-3 mr-1.5" />
                              )}
                              <span className="ml-1.5">{r.status}</span>
                            </span>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="text-center">
                              <div className="font-medium text-gray-900">{r.totalGenerated}</div>
                              <div className="text-sm text-gray-500">Generated</div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => generateInvoiceFromRecurring(r._id)}
                                title="Generate Invoice"
                              >
                                <Zap className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => toggleRecurringStatus(r._id)}
                                title={r.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                              >
                                {r.status === 'ACTIVE' ? (
                                  <Pause className="w-4 h-4" />
                                ) : (
                                  <Play className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => duplicateRecurringInvoice(r._id)}
                                title="Duplicate"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => deleteRecurringInvoice(r._id)}
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ModernCard>

              {/* Create Recurring Invoice CTA */}
              <ModernCard
                title="Create Recurring Invoice"
                description="Set up automated invoice generation with custom schedules."
              >
                <div className="text-center py-8">
                  <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4">
                    <Repeat className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Create Your First Recurring Invoice
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Set up automated invoice generation for regular customers and services.
                  </p>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Recurring Invoice
                  </Button>
                </div>
              </ModernCard>
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
