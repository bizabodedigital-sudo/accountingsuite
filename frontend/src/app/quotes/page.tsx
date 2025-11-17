'use client';

import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Plus, Search, Filter, CheckCircle, XCircle, Clock, Eye, Edit, Trash2, ArrowRight, FileCheck } from 'lucide-react';
import { quoteAPI } from '@/lib/api';

export default function QuotesPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [quotes, setQuotes] = useState<any[]>([]);
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
      loadQuotes();
    }
  }, [isAuthenticated, statusFilter]);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const response = await quoteAPI.getQuotes(params);
      setQuotes(response.data.data || []);
    } catch (error) {
      console.error('Failed to load quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      DRAFT: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', icon: FileText, label: 'Draft' },
      SENT: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: Clock, label: 'Sent' },
      APPROVED: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: CheckCircle, label: 'Approved' },
      REJECTED: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: XCircle, label: 'Rejected' },
      EXPIRED: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300', icon: Clock, label: 'Expired' },
      CONVERTED: { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300', icon: CheckCircle, label: 'Converted' },
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

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = !searchTerm || 
      quote.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.customerId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading quotes...</p>
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
        title="Quotes"
        subtitle="Manage quotes and estimates"
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Actions Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-1 gap-2 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search quotes..."
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
              <option value="SENT">Sent</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="EXPIRED">Expired</option>
              <option value="CONVERTED">Converted</option>
            </select>
          </div>
          <Button
            onClick={() => router.push('/quotes/create')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Quote
          </Button>
        </div>

        {/* Quotes List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading quotes...</p>
          </div>
        ) : filteredQuotes.length === 0 ? (
          <ModernCard className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No quotes found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Get started by creating your first quote</p>
            <Button
              onClick={() => router.push('/quotes/create')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Quote
            </Button>
          </ModernCard>
        ) : (
          <div className="grid gap-4">
            {filteredQuotes.map((quote) => (
              <ModernCard key={quote._id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {quote.number || 'QUO-001'}
                      </h3>
                      {getStatusBadge(quote.status)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div>
                        <span className="font-medium">Customer:</span>{' '}
                        {typeof quote.customerId === 'object' ? quote.customerId.name : 'Unknown'}
                      </div>
                      <div>
                        <span className="font-medium">Issue Date:</span>{' '}
                        {new Date(quote.issueDate).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Expiry Date:</span>{' '}
                        {new Date(quote.expiryDate).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Total:</span>{' '}
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          ${quote.total?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/quotes/${quote._id}`)}
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {quote.status === 'DRAFT' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/quotes/${quote._id}/edit`)}
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    {quote.status === 'SENT' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            await quoteAPI.approveQuote(quote._id);
                            loadQuotes();
                          } catch (error) {
                            console.error('Failed to approve quote:', error);
                          }
                        }}
                        title="Approve"
                      >
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </Button>
                    )}
                    {quote.status === 'APPROVED' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            const response = await quoteAPI.convertQuote(quote._id);
                            if (response.data.data?.invoice) {
                              router.push(`/invoices/${response.data.data.invoice._id}`);
                            }
                          } catch (error) {
                            console.error('Failed to convert quote:', error);
                          }
                        }}
                        title="Convert to Invoice"
                      >
                        <ArrowRight className="w-4 h-4 text-blue-600" />
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

