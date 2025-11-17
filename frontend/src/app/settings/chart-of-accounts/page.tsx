'use client';

import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { ModernCard } from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calculator, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  ChevronRight, 
  ChevronDown,
  FileText,
  Building2,
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Lock,
  Unlock
} from 'lucide-react';
import { chartOfAccountAPI } from '@/lib/api';

interface Account {
  _id: string;
  code: string;
  name: string;
  type: string;
  category: string;
  parentId?: string;
  normalBalance: string;
  openingBalance: number;
  currentBalance: number;
  isActive: boolean;
  children?: Account[];
}

export default function ChartOfAccountsPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadAccounts();
    }
  }, [isAuthenticated, typeFilter]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (typeFilter !== 'all') {
        params.type = typeFilter;
      }
      const response = await chartOfAccountAPI.getAccounts(params);
      const flatAccounts = response.data.data || [];
      
      // Build hierarchical structure
      const accountMap = new Map<string, Account>();
      const rootAccounts: Account[] = [];

      // First pass: create map
      flatAccounts.forEach((acc: Account) => {
        accountMap.set(acc._id, { ...acc, children: [] });
      });

      // Second pass: build tree
      flatAccounts.forEach((acc: Account) => {
        const account = accountMap.get(acc._id)!;
        if (acc.parentId && accountMap.has(acc.parentId)) {
          const parent = accountMap.get(acc.parentId)!;
          if (!parent.children) parent.children = [];
          parent.children.push(account);
        } else {
          rootAccounts.push(account);
        }
      });

      setAccounts(rootAccounts);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (accountId: string) => {
    const newExpanded = new Set(expandedAccounts);
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId);
    } else {
      newExpanded.add(accountId);
    }
    setExpandedAccounts(newExpanded);
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      ASSET: Wallet,
      LIABILITY: TrendingDown,
      EQUITY: Building2,
      REVENUE: TrendingUp,
      EXPENSE: TrendingDown,
    };
    return icons[type] || FileText;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      ASSET: 'text-blue-600 dark:text-blue-400',
      LIABILITY: 'text-red-600 dark:text-red-400',
      EQUITY: 'text-green-600 dark:text-green-400',
      REVENUE: 'text-purple-600 dark:text-purple-400',
      EXPENSE: 'text-orange-600 dark:text-orange-400',
    };
    return colors[type] || 'text-gray-600 dark:text-gray-400';
  };

  const filterAccounts = (accountList: Account[]): Account[] => {
    if (!searchTerm) return accountList;
    
    return accountList.filter(acc => {
      const matches = 
        acc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (acc.children && acc.children.length > 0) {
        const filteredChildren = filterAccounts(acc.children);
        if (filteredChildren.length > 0 || matches) {
          return { ...acc, children: filteredChildren };
        }
      }
      
      return matches;
    }).map(acc => {
      if (acc.children && acc.children.length > 0) {
        return { ...acc, children: filterAccounts(acc.children) };
      }
      return acc;
    });
  };

  const renderAccount = (account: Account, level: number = 0) => {
    const hasChildren = account.children && account.children.length > 0;
    const isExpanded = expandedAccounts.has(account._id);
    const TypeIcon = getTypeIcon(account.type);

    return (
      <div key={account._id} className="border-b border-gray-200 dark:border-gray-700">
        <div 
          className={`flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
            level > 0 ? 'pl-' + (level * 4 + 12) : ''
          }`}
        >
          <div className="flex items-center gap-2 flex-1">
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(account._id)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            ) : (
              <div className="w-6" />
            )}
            
            <TypeIcon className={`w-5 h-5 ${getTypeColor(account.type)}`} />
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {account.code}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {account.name}
                </span>
                {!account.isActive && (
                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                    Inactive
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {account.type} • {account.category} • Balance: ${account.currentBalance?.toFixed(2) || '0.00'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingAccount(account)}
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                if (confirm(`Delete account ${account.code} - ${account.name}?`)) {
                  try {
                    await chartOfAccountAPI.deleteAccount(account._id);
                    loadAccounts();
                  } catch (error) {
                    console.error('Failed to delete account:', error);
                    alert('Failed to delete account');
                  }
                }
              }}
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {account.children!.map(child => renderAccount(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const filteredAccounts = filterAccounts(accounts);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading chart of accounts...</p>
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
        title="Chart of Accounts"
        subtitle="Manage your accounting accounts"
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Actions Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-1 gap-2 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="ASSET">Assets</option>
              <option value="LIABILITY">Liabilities</option>
              <option value="EQUITY">Equity</option>
              <option value="REVENUE">Revenue</option>
              <option value="EXPENSE">Expenses</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                if (confirm('Initialize default chart of accounts? This will create standard accounts.')) {
                  try {
                    await chartOfAccountAPI.initializeCOA();
                    loadAccounts();
                    alert('Chart of accounts initialized successfully!');
                  } catch (error) {
                    console.error('Failed to initialize COA:', error);
                    alert('Failed to initialize chart of accounts');
                  }
                }
              }}
            >
              Initialize COA
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Account
            </Button>
          </div>
        </div>

        {/* Accounts Tree */}
        {filteredAccounts.length === 0 ? (
          <ModernCard className="p-12 text-center">
            <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No accounts found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Get started by initializing the chart of accounts or creating your first account</p>
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                onClick={async () => {
                  if (confirm('Initialize default chart of accounts?')) {
                    try {
                      await chartOfAccountAPI.initializeCOA();
                      loadAccounts();
                    } catch (error) {
                      console.error('Failed to initialize COA:', error);
                    }
                  }
                }}
              >
                Initialize COA
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Account
              </Button>
            </div>
          </ModernCard>
        ) : (
          <ModernCard className="p-0 overflow-hidden">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAccounts.map(account => renderAccount(account))}
            </div>
          </ModernCard>
        )}
      </div>

      {/* Create/Edit Modal - Simplified for now */}
      {(showCreateModal || editingAccount) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingAccount ? 'Edit Account' : 'Create Account'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Account creation form will be implemented here
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingAccount(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

