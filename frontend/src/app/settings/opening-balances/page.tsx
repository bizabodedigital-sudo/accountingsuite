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
  Calendar,
  CheckCircle,
  XCircle,
  Upload,
  FileText
} from 'lucide-react';
import { openingBalanceAPI, chartOfAccountAPI } from '@/lib/api';
import OpeningBalancesWizard from '@/components/OpeningBalancesWizard';
import PeriodLockWarning from '@/components/PeriodLockWarning';

interface OpeningBalance {
  _id: string;
  accountId: any;
  accountCode: string;
  accountName: string;
  balance: number;
  asOfDate: string;
  isPosted: boolean;
  postedAt?: string;
}

export default function OpeningBalancesPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [balances, setBalances] = useState<OpeningBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [asOfDateFilter, setAsOfDateFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showWizard, setShowWizard] = useState(false);

  // Create form state
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [balance, setBalance] = useState(0);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadBalances();
      loadAccounts();
    }
  }, [isAuthenticated, asOfDateFilter]);

  const loadAccounts = async () => {
    try {
      const response = await chartOfAccountAPI.getAccounts({ isActive: true });
      setAccounts(response.data.data || []);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  };

  const loadBalances = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (asOfDateFilter) {
        params.asOfDate = asOfDateFilter;
      }
      const response = await openingBalanceAPI.getOpeningBalances(params);
      setBalances(response.data.data || []);
    } catch (error) {
      console.error('Failed to load opening balances:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!selectedAccountId || balance === 0) {
      alert('Please select an account and enter a balance');
      return;
    }

    try {
      await openingBalanceAPI.createOpeningBalance({
        accountId: selectedAccountId,
        balance,
        asOfDate,
        description
      });
      
      setShowCreateModal(false);
      setSelectedAccountId('');
      setBalance(0);
      setDescription('');
      loadBalances();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create opening balance');
    }
  };

  const handlePostBalances = async () => {
    if (!asOfDateFilter) {
      alert('Please select an "As Of" date to post balances');
      return;
    }

    if (confirm(`Post all unposted opening balances as of ${asOfDateFilter}?`)) {
      try {
        await openingBalanceAPI.postOpeningBalances({ asOfDate: asOfDateFilter });
        loadBalances();
        alert('Opening balances posted successfully!');
      } catch (error: any) {
        alert(error.response?.data?.error || 'Failed to post opening balances');
      }
    }
  };

  const filteredBalances = balances.filter(balance =>
    !searchTerm ||
    balance.accountCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    balance.accountName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const unpostedCount = filteredBalances.filter(b => !b.isPosted).length;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading opening balances...</p>
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
        title="Opening Balances"
        subtitle="Set opening balances for accounts"
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Actions Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-1 gap-2 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search balances..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <input
              type="date"
              value={asOfDateFilter}
              onChange={(e) => setAsOfDateFilter(e.target.value)}
              placeholder="As Of Date"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            {unpostedCount > 0 && asOfDateFilter && (
              <Button
                variant="outline"
                onClick={handlePostBalances}
                className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Post {unpostedCount} Balance{unpostedCount !== 1 ? 's' : ''}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setShowWizard(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              Setup Wizard
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Balance
            </Button>
          </div>
        </div>

        {/* Balances List */}
        {filteredBalances.length === 0 ? (
          <ModernCard className="p-12 text-center">
            <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No opening balances found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first opening balance to get started</p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Balance
            </Button>
          </ModernCard>
        ) : (
          <div className="grid gap-4">
            {filteredBalances.map((balance) => (
              <ModernCard key={balance._id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {balance.accountCode} - {balance.accountName}
                      </h3>
                      {balance.isPosted ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          <CheckCircle className="w-3 h-3 inline mr-1" />
                          Posted
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                          <XCircle className="w-3 h-3 inline mr-1" />
                          Unposted
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div>
                        <span className="font-medium">Balance:</span>{' '}
                        <span className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                          ${balance.balance?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">As Of Date:</span>{' '}
                        {new Date(balance.asOfDate).toLocaleDateString()}
                      </div>
                      {balance.postedAt && (
                        <div>
                          <span className="font-medium">Posted At:</span>{' '}
                          {new Date(balance.postedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </ModernCard>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Create Opening Balance</h3>
            
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Account</label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select Account</option>
                  {accounts.map(acc => (
                    <option key={acc._id} value={acc._id}>
                      {acc.code} - {acc.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Balance</label>
                <input
                  type="number"
                  step="0.01"
                  value={balance || ''}
                  onChange={(e) => setBalance(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">As Of Date</label>
                <input
                  type="date"
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <PeriodLockWarning date={asOfDate} className="mt-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Opening balance description"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedAccountId('');
                  setBalance(0);
                  setDescription('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                Create Balance
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Opening Balances Setup Wizard</h2>
              <Button
                variant="outline"
                onClick={() => setShowWizard(false)}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
            <OpeningBalancesWizard 
              onComplete={() => {
                setShowWizard(false);
                loadBalances();
              }} 
            />
          </div>
        </div>
      )}
    </div>
  );
}

